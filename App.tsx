import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Contestant, ShowdownTheme, Question, Room } from './src/types';
import { CONTESTANTS } from './src/data/contestants';
import { SHOWDOWN_THEMES, getQuestionsForTheme } from './src/data/questions';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategorySelectScreen } from './src/screens/CategorySelectScreen';
import { CategoryCreatorScreen } from './src/screens/CategoryCreatorScreen';
import { GauntletGameScreen } from './src/screens/GauntletGameScreen';
import { DuelGameScreen } from './src/screens/DuelGameScreen';
import { PassAndPlayScreen } from './src/screens/PassAndPlayScreen';
import { VictoryScreen } from './src/screens/VictoryScreen';
import { RoomLobbyScreen } from './src/screens/RoomLobbyScreen';
import { WaitingRoomScreen } from './src/screens/WaitingRoomScreen';
import { MultiplayerGameScreen } from './src/screens/MultiplayerGameScreen';
import { RoomVictoryScreen } from './src/screens/RoomVictoryScreen';
import { theme } from './src/theme';

type Screen =
  | 'home'
  | 'category_select'
  | 'category_creator'
  | 'gauntlet'
  | 'duel'
  | 'pass_play'
  | 'victory'
  | 'room_lobby' // create or join a live room
  | 'room_waiting' // lobby — waiting for players
  | 'room_game' // live multiplayer game
  | 'room_victory'; // multiplayer results

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // ── Single-player state ────────────────────────────────────────────────────
  const [themesList, setThemesList] = useState<ShowdownTheme[]>(SHOWDOWN_THEMES);
  const [customQuestionsMap, setCustomQuestionsMap] = useState<Record<string, Question[]>>({});
  const [activeTheme, setActiveTheme] = useState<ShowdownTheme>(SHOWDOWN_THEMES[0]);
  const [activeQuestionPool, setActiveQuestionPool] = useState<Question[]>(
    getQuestionsForTheme(SHOWDOWN_THEMES[0].defaultQuestionFilter),
  );
  const [userName, setUserName] = useState('Alex');
  const [userRole, setUserRole] = useState('Trivia Explorer');
  const [userEmoji, setUserEmoji] = useState('🌟');
  const [playerContestant, setPlayerContestant] = useState<Contestant>(CONTESTANTS[0]);
  const [opponentContestants, setOpponentContestants] = useState<Contestant[]>(
    CONTESTANTS.slice(1, 10),
  );
  const [winner, setWinner] = useState<Contestant>(CONTESTANTS[0]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<
    { contestant: Contestant; score: number }[]
  >([]);

  // ── Multiplayer room state ─────────────────────────────────────────────────
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  // ── Handlers: single-player ────────────────────────────────────────────────
  const handleConfirmSetup = (
    player: Contestant,
    opponents: Contestant[],
    selectedTheme: ShowdownTheme,
    customQuestions: Question[],
  ) => {
    setPlayerContestant(player);
    setOpponentContestants(opponents);
    setActiveTheme(selectedTheme);
    setUserName(player.name.replace(' (You)', ''));
    setUserRole(player.job);
    setUserEmoji(player.emoji);
    const pool = getQuestionsForTheme(
      selectedTheme.defaultQuestionFilter,
      customQuestions.length > 0 ? customQuestions : customQuestionsMap[selectedTheme.id],
    );
    setActiveQuestionPool(pool);
    setCurrentScreen('gauntlet');
  };

  const handleSaveCustomCategory = (newTheme: ShowdownTheme, questions: Question[]) => {
    setThemesList((prev) => [newTheme, ...prev]);
    if (questions.length > 0) {
      setCustomQuestionsMap((prev) => ({ ...prev, [newTheme.id]: questions }));
    }
    setActiveTheme(newTheme);
    setCurrentScreen('category_select');
  };

  const handleFinishGauntlet = (
    matchWinner: Contestant,
    leaderboard: { contestant: Contestant; score: number }[],
  ) => {
    setWinner(matchWinner);
    setFinalLeaderboard(leaderboard);
    setCurrentScreen('victory');
  };

  // ── Handlers: multiplayer ──────────────────────────────────────────────────
  const handleRoomReady = (room: Room, pid: string) => {
    setActiveRoom(room);
    setMyPlayerId(pid);
    setCurrentScreen('room_waiting');
  };

  const handleRoomGameStart = (room: Room) => {
    setActiveRoom(room);
    setCurrentScreen('room_game');
  };

  const handleRoomFinish = (room: Room) => {
    setActiveRoom(room);
    setCurrentScreen('room_victory');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {currentScreen === 'home' && (
        <HomeScreen
          onStartGauntlet={() => setCurrentScreen('category_select')}
          onStartDuel={() => setCurrentScreen('duel')}
          onStartPassPlay={() => setCurrentScreen('pass_play')}
          onOpenCategoryCreator={() => setCurrentScreen('category_creator')}
          onStartRoom={() => setCurrentScreen('room_lobby')}
          userName={userName}
          userEmoji={userEmoji}
          userRole={userRole}
        />
      )}

      {currentScreen === 'category_select' && (
        <CategorySelectScreen
          availableThemes={themesList}
          customQuestionsMap={customQuestionsMap}
          onConfirmSetup={handleConfirmSetup}
          onOpenCategoryCreator={() => setCurrentScreen('category_creator')}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'category_creator' && (
        <CategoryCreatorScreen
          onSaveCategory={handleSaveCustomCategory}
          onBack={() => setCurrentScreen('category_select')}
        />
      )}

      {currentScreen === 'gauntlet' && (
        <GauntletGameScreen
          playerContestant={playerContestant}
          opponentContestants={opponentContestants}
          questionPool={activeQuestionPool}
          onFinishGame={handleFinishGauntlet}
          onExit={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'duel' && (
        <DuelGameScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'pass_play' && (
        <PassAndPlayScreen onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'victory' && (
        <VictoryScreen
          winner={winner}
          playerContestant={playerContestant}
          finalLeaderboard={finalLeaderboard}
          onPlayAgain={() => setCurrentScreen('gauntlet')}
          onHome={() => setCurrentScreen('home')}
        />
      )}

      {/* ── Multiplayer Rooms ── */}
      {currentScreen === 'room_lobby' && (
        <RoomLobbyScreen
          onRoomReady={handleRoomReady}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'room_waiting' && activeRoom && (
        <WaitingRoomScreen
          initialRoom={activeRoom}
          playerId={myPlayerId}
          onGameStart={handleRoomGameStart}
          onLeave={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'room_game' && activeRoom && (
        <MultiplayerGameScreen
          initialRoom={activeRoom}
          playerId={myPlayerId}
          onFinish={handleRoomFinish}
          onExit={() => setCurrentScreen('home')}
        />
      )}

      {currentScreen === 'room_victory' && activeRoom && (
        <RoomVictoryScreen
          room={activeRoom}
          playerId={myPlayerId}
          onPlayAgain={() => setCurrentScreen('room_lobby')}
          onHome={() => setCurrentScreen('home')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
