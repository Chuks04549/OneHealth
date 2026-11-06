import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import ChatBubble from '../components/ChatBubble';
import GoalCard from '../components/GoalCard';
import TypingIndicator from '../components/TypingIndicator';
import QuickReplies from '../components/QuickReplies';
import RunLogBubble from '../components/RunLogBubble';
import LogRunModal from '../components/LogRunModal';
import LogFoodModal from '../components/LogFoodModal';
import FoodLogBubble from '../components/FoodLogBubble';
import WorkoutLogBubble from '../components/WorkoutLogBubble';
import { useFocusEffect } from '@react-navigation/native';
import { sendCoachMessage } from '../services/coachAI';
import {
  getMessages,
  saveMessages,
  getRuns,
  addRun,
  getFoods,
  addFood,
  getWorkouts,
  recordSessionOpen,
  getEngagementSummary,
  getEugeneWelcomeSeen,
  markEugeneWelcomeSeen,
} from '../services/storage';
import { colors, radius, type } from '../theme';
import { formatDistance, useUnits } from '../../contexts/UnitContext';
import useFloatingTabBarClearance from '../../hooks/useFloatingTabBarClearance';
import LiquidGlassBackButton from '../../components/LiquidGlassBackButton';

const now = () =>
  new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

let nextId = 1;
const makeId = () => `m${nextId++}`;
let hasActiveDialogueThisSession = false;

const FIRST_RUN_MESSAGE = {
  id: makeId(),
  sender: 'coach',
  type: 'text',
  text: "Hey — I'm Eugene, your health assistant. Ask me about nutrition, movement, recovery, goals, or general wellness whenever you're ready.",
  timestamp: now(),
};

const INITIAL_QUICK_REPLIES = ['Why do you need that?', "I'll log one now"];
let cachedChatPresentation = null;

export default function ChatScreen({ onBack, onLogWorkout, initialDraft = '', draftId }) {
  const { unitSystem } = useUnits();
  const tabBarClearance = useFloatingTabBarClearance();
  const openedWithDraft = Boolean(String(initialDraft).trim());
  const [messages, setMessages] = useState(cachedChatPresentation?.messages || []);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState(cachedChatPresentation?.quickReplies || []);
  const [runs, setRuns] = useState([]);
  const [foods, setFoods] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [engagement, setEngagement] = useState(null);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [runModalVisible, setRunModalVisible] = useState(false);
  const [hydrated, setHydrated] = useState(Boolean(cachedChatPresentation));
  const [historyPositioned, setHistoryPositioned] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [introMode, setIntroMode] = useState(false);
  const [chatViewportHeight, setChatViewportHeight] = useState(0);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeSuppressedRef = useRef(hasActiveDialogueThisSession || openedWithDraft);
  const scrollRef = useRef(null);
  const keyboardVisibleRef = useRef(false);
  const keyboardScrollTimerRef = useRef(null);

  const hideWelcome = () => {
    welcomeSuppressedRef.current = true;
    if (!welcomeVisible) return;
    Animated.timing(welcomeOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setWelcomeVisible(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([getEugeneWelcomeSeen(), getMessages()]).then(([seen, savedMessages]) => {
      const welcomeWasPreviouslyViewed = seen || (savedMessages?.length > 0);
      if (welcomeWasPreviouslyViewed && !seen) markEugeneWelcomeSeen();
      if (
        !active
        || welcomeWasPreviouslyViewed
        || welcomeSuppressedRef.current
        || hasActiveDialogueThisSession
        || openedWithDraft
      ) return;

      welcomeOpacity.setValue(1);
      setIntroMode(true);
      setWelcomeVisible(true);
      markEugeneWelcomeSeen();
    });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getWorkouts().then((savedWorkouts) => setWorkouts(savedWorkouts || []));
    }, []),
  );

  useEffect(() => {
    if (initialDraft) {
      setInput(initialDraft);
      setIntroMode(false);
      welcomeOpacity.stopAnimation();
      welcomeOpacity.setValue(0);
      setWelcomeVisible(false);
    }
  }, [draftId, initialDraft]);

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  };

  // ---- Load persisted state on mount ----
  useEffect(() => {
    (async () => {
      const [savedMessages, savedRuns, savedFoods, savedWorkouts] = await Promise.all([
        getMessages(),
        getRuns(),
        getFoods(),
        getWorkouts(),
      ]);
      await recordSessionOpen();
      const eng = await getEngagementSummary();
      setEngagement(eng);
      setRuns(savedRuns || []);
      setFoods(savedFoods || []);
      setWorkouts(savedWorkouts || []);

      if (savedMessages && savedMessages.length > 0) {
        // Keep nextId ahead of anything restored so new messages don't collide.
        const maxId = savedMessages.reduce((m, msg) => {
          const n = parseInt(String(msg.id).replace('m', ''), 10);
          return Number.isFinite(n) ? Math.max(m, n) : m;
        }, 0);
        nextId = maxId + 1;
        setMessages(savedMessages);
        setQuickReplies([]);
      } else if (eng.status === 'lapsed') {
        setMessages([
          {
            ...FIRST_RUN_MESSAGE,
            id: makeId(),
            text: `Welcome back — it's been ${eng.daysSinceLastOpen} days. No pressure, just pick up whenever you're ready. Got a run to log?`,
          },
        ]);
      } else {
        setMessages([FIRST_RUN_MESSAGE]);
        setQuickReplies(INITIAL_QUICK_REPLIES);
      }
      setHydrated(true);
    })();
  }, []);

  // ---- Persist messages whenever they change (after initial hydration) ----
  useEffect(() => {
    if (!hydrated) return;
    cachedChatPresentation = { messages, quickReplies };
    saveMessages(messages);
  }, [messages, quickReplies, hydrated]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, typing]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === 'ios') Keyboard.scheduleLayoutAnimation(event);
      const screenY = Number(event?.endCoordinates?.screenY);
      const keyboardHeight = Number(event?.endCoordinates?.height);
      const windowHeight = Dimensions.get('window').height;
      const nextInset = Platform.OS === 'ios' && Number.isFinite(keyboardHeight)
        ? Math.max(0, keyboardHeight)
        : Number.isFinite(screenY)
          ? Math.max(0, windowHeight - screenY)
          : Math.max(0, keyboardHeight || 0);
      setKeyboardInset(nextInset);
      keyboardVisibleRef.current = true;
      setKeyboardVisible(true);
      clearTimeout(keyboardScrollTimerRef.current);
      keyboardScrollTimerRef.current = setTimeout(
        () => scrollToBottom(false),
        Platform.OS === 'ios' ? (event?.duration || 250) + 30 : 30,
      );
    });
    const hideSubscription = Keyboard.addListener(hideEvent, (event) => {
      if (Platform.OS === 'ios' && event) Keyboard.scheduleLayoutAnimation(event);
      setKeyboardInset(0);
      keyboardVisibleRef.current = false;
      setKeyboardVisible(false);
    });

    return () => {
      clearTimeout(keyboardScrollTimerRef.current);
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const appendMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const runCoachTurn = async (historyForApi, runsOverride, foodsOverride, workoutsOverride) => {
    setTyping(true);
    setQuickReplies([]);
    try {
      const reply = await sendCoachMessage(
        historyForApi,
        runsOverride ?? runs,
        engagement,
        foodsOverride ?? foods,
        unitSystem,
        workoutsOverride ?? workouts,
      );
      setTyping(false);

      if (reply.type === 'safety') {
        appendMessage({ id: makeId(), sender: 'coach', type: 'text', text: reply.text, timestamp: now() });
        return;
      }

      if (reply.text) {
        appendMessage({
          id: makeId(),
          sender: 'coach',
          type: 'text',
          text: reply.text,
          reasoning: reply.reasoning || null,
          timestamp: now(),
        });
      }
      if (reply.type === 'goal') {
        appendMessage({ id: makeId(), sender: 'coach', type: 'goal', goal: reply.goal, timestamp: now() });
      } else {
        setQuickReplies(['Sounds good', 'Can we adjust it?', 'Log another run']);
      }
    } catch (err) {
      setTyping(false);
      appendMessage({
        id: makeId(),
        sender: 'coach',
        type: 'text',
        text: "Hmm, I couldn't reach the coaching service just now. Mind trying again in a moment?",
        timestamp: now(),
      });
    }
  };

  const sendText = (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    const userMsg = { id: makeId(), sender: 'user', type: 'text', text: trimmed, timestamp: now() };
    hasActiveDialogueThisSession = true;
    setIntroMode(false);
    hideWelcome();
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    runCoachTurn(nextHistory);
  };

  const handleGoalConfirm = (goal, cardMsgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === cardMsgId ? { ...m, goal, confirmed: true } : m))
    );
    const confirmMsg = {
      id: makeId(),
      sender: 'coach',
      type: 'text',
      text: `Locked in: ${formatDistance(goal.km, unitSystem)} across ${goal.sessions} sessions next week. I'll check in Sunday to see how it went.`,
      timestamp: now(),
    };
    appendMessage(confirmMsg);
    setQuickReplies(["Let's go", 'Adjust my schedule']);
  };

  const handleGoalEdit = (goal, cardMsgId) => {
    setMessages((prev) => prev.map((m) => (m.id === cardMsgId ? { ...m, goal } : m)));
  };

  const handleSaveFood = async (foodDraft) => {
    const savedFood = await addFood(foodDraft);
    const nextFoods = [savedFood, ...foods];
    setFoods(nextFoods);
    setFoodModalVisible(false);

    const foodLogMsg = { id: makeId(), sender: 'user', type: 'food', food: savedFood, timestamp: now() };
    const nextHistory = [
      ...messages,
      foodLogMsg,
      { sender: 'user', text: `Logged a meal: ${savedFood.description}.` },
    ];
    setMessages([...messages, foodLogMsg]);
    runCoachTurn(nextHistory, runs, nextFoods);
  };

  const handleSaveRun = async (runDraft) => {
    const savedRun = await addRun(runDraft);
    const nextRuns = [savedRun, ...runs];
    setRuns(nextRuns);
    setRunModalVisible(false);

    const runLogMsg = { id: makeId(), sender: 'user', type: 'run', run: savedRun, timestamp: now() };
    const nextHistory = [
      ...messages,
      runLogMsg,
      { sender: 'user', text: `Logged a run: ${savedRun.km}km in ${savedRun.durationMin} min.` },
    ];
    setMessages([...messages, runLogMsg]);
    runCoachTurn(nextHistory, nextRuns);
  };

  return (
    <View style={[styles.flex, keyboardInset > 0 && { paddingBottom: keyboardInset }]}>
      <View style={styles.header}>
        <LiquidGlassBackButton onPress={onBack} size={36} iconSize={18} accessibilityLabel="Leave Eugene chat" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Eugene</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>
              {engagement?.streakDays > 1 ? `${engagement.streakDays}-day streak` : 'Health Assistant'}
            </Text>
          </View>
        </View>
        <View style={styles.headerBtns}>
          <Pressable style={styles.workoutBtn} onPress={onLogWorkout}>
            <Text style={styles.workoutBtnText}>+ Workout</Text>
          </Pressable>
          <Pressable style={styles.runBtn} onPress={() => setRunModalVisible(true)}>
            <Text style={styles.runBtnText}>+ Run</Text>
          </Pressable>
          <Pressable style={styles.foodBtn} onPress={() => setFoodModalVisible(true)}>
            <Text style={styles.foodBtnText}>+ Food</Text>
          </Pressable>
        </View>
      </View>

      {welcomeVisible ? (
        <Animated.View pointerEvents="none" style={[styles.welcomeOverlay, { opacity: welcomeOpacity }]}>
          <Text style={styles.welcomeTitle}>Hi, I’m Eugene.</Text>
          <Text style={styles.welcomeText}>What would you like to do today?</Text>
        </Animated.View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={[styles.flex, !historyPositioned && styles.historyHidden]}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        removeClippedSubviews={false}
        onContentSizeChange={() => {
          scrollRef.current?.scrollToEnd({ animated: false });
          if (hydrated && !historyPositioned) {
            requestAnimationFrame(() => {
              scrollRef.current?.scrollToEnd({ animated: false });
              setHistoryPositioned(true);
            });
          }
        }}
        onLayout={(event) => {
          const nextHeight = Math.round(event.nativeEvent.layout.height);
          if (nextHeight > 0 && nextHeight !== chatViewportHeight) setChatViewportHeight(nextHeight);
          if (keyboardVisibleRef.current) scrollToBottom(false);
        }}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onScrollBeginDrag={hideWelcome}
      >
        {messages.map((m) => {
          if (m.type === 'goal') {
            return (
              <GoalCard
                key={m.id}
                goal={m.goal}
                editable={!m.confirmed}
                onConfirm={(g) => handleGoalConfirm(g, m.id)}
                onEdit={(g) => handleGoalEdit(g, m.id)}
              />
            );
          }
          if (m.type === 'run') {
            return <RunLogBubble key={m.id} run={m.run} />;
          }
          if (m.type === 'food') {
            return <FoodLogBubble key={m.id} food={m.food} />;
          }
          if (m.type === 'workout') {
            return <WorkoutLogBubble key={m.id} workout={m.workout} />;
          }
          return <ChatBubble key={m.id} message={m} onAsk={(draft) => { setInput(draft); hideWelcome(); }} />;
        })}
        {typing && <TypingIndicator />}
        {introMode && chatViewportHeight > 0 ? <View style={{ height: Math.max(1, chatViewportHeight - 24) }} /> : null}
      </ScrollView>

      <QuickReplies options={keyboardVisible ? [] : quickReplies} onSelect={sendText} />

      <View style={[styles.inputRow, !keyboardVisible && { marginBottom: tabBarClearance }]}>
        <TextInput
          style={styles.input}
          placeholder="Message your coach…"
          placeholderTextColor={colors.inkFaint}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendText(input)}
          returnKeyType="send"
          editable={!typing}
          maxLength={1000}
          accessibilityLabel="Message Eugene"
          onFocus={() => {
            hideWelcome();
            scrollToBottom(false);
            clearTimeout(keyboardScrollTimerRef.current);
            keyboardScrollTimerRef.current = setTimeout(() => scrollToBottom(false), 350);
          }}
        />
        <Pressable
          style={[styles.sendBtn, (typing || !input.trim()) && styles.sendBtnDisabled]}
          onPress={() => sendText(input)}
          disabled={typing || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </Pressable>
      </View>

      <LogFoodModal
        visible={foodModalVisible}
        onClose={() => setFoodModalVisible(false)}
        onSave={handleSaveFood}
      />

      <LogRunModal
        visible={runModalVisible}
        onClose={() => setRunModalVisible(false)}
        onSave={handleSaveRun}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  historyHidden: { opacity: 0 },
  welcomeOverlay: { position: 'absolute', zIndex: 2, top: '38%', left: 36, right: 36, alignItems: 'center' },
  welcomeTitle: { color: colors.ink, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  welcomeText: { color: colors.inkMuted, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.bg,
  },
  headerCenter: { flex: 1, alignItems: 'flex-start', marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 5 },
  onlineText: { fontSize: 12, color: colors.accentDark, fontWeight: '600' },
  headerBtns: { flexDirection: 'row', gap: 6 },
  foodBtn: {
    paddingHorizontal: 11,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.food,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  workoutBtn: {
    paddingHorizontal: 11,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.workout,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  runBtn: {
    paddingHorizontal: 11,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.run,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  messagesContent: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    marginRight: 10,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.42 },
  sendBtnText: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
