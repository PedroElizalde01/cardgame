import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import _ from 'lodash';

const CardGame = () => {
  const [cards, setCards] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [gameState, setGameState] = useState('initial');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState({ wins: 0, losses: 0 });
  const [positions, setPositions] = useState([]);
  const [jokerFinalPosition, setJokerFinalPosition] = useState(0);

  const ROUNDS_PER_TRIAL = 3;
  const CARD_WIDTH = 96;
  const CARD_HEIGHT = 128;
  const GAP = 16;
  const BASE_SWAP_TIME = 500; // Tiempo base para cada intercambio
  const MIN_SWAP_TIME = 200; // Tiempo mínimo para cada intercambio
  
  useEffect(() => {
    resetForNextRound();
  }, [currentTrial]);

  const resetForNextRound = () => {
    setIsFlipped(false);
    setIsMixing(false);
    initializeGame();
  };

  const initializeGame = () => {
    const newCards = Array(4).fill(null).map((_, index) => ({
      id: index,
      isJoker: index === 0,
      isFlipped: false
    }));
    
    const initialPositions = newCards.map((_, index) => ({
      x: index * (CARD_WIDTH + GAP),
      y: 0
    }));
    
    setCards(newCards);
    setPositions(initialPositions);
    setGameState('initial');
    setMessage('¡Observa dónde está el comodín!');
    setJokerFinalPosition(0); // Reinicia la posición final del comodín
  };

  const generateRandomSwaps = () => {
    const numSwaps = 8 + Math.floor(Math.random() * 4); // Entre 8 y 11 intercambios
    const swaps = [];
    let currentJokerPos = 0; // Comenzamos con el comodín en la posición 0

    for (let i = 0; i < numSwaps; i++) {
      // Genera un intercambio aleatorio que involucre la posición actual del comodín
      const otherPos = Math.floor(Math.random() * 3); // 0-2
      const pos2 = otherPos >= currentJokerPos ? otherPos + 1 : otherPos; // Ajusta para evitar la misma posición
      swaps.push([currentJokerPos, pos2]);
      currentJokerPos = pos2; // Actualiza la posición del comodín
    }

    setJokerFinalPosition(currentJokerPos);
    return swaps;
  };

  const flipCards = () => {
    setIsFlipped(true);
    setGameState('flipped');
    setTimeout(() => {
      startMixing();
    }, 1000);
  };

  const performSingleSwap = (currentPositions, i, j) => {
    const newPositions = [...currentPositions];
    [newPositions[i], newPositions[j]] = [newPositions[j], newPositions[i]];
    return newPositions;
  };

  const startMixing = () => {
    setIsMixing(true);
    setGameState('mixing');

    // Calcula el tiempo de intercambio basado en la ronda actual
    const swapTime = Math.max(
      MIN_SWAP_TIME,
      BASE_SWAP_TIME - ((currentRound - 1) * 100)
    );

    const mixingSequence = generateRandomSwaps();
    let currentPositions = [...positions];
    
    mixingSequence.forEach((swap, index) => {
      setTimeout(() => {
        currentPositions = performSingleSwap(currentPositions, swap[0], swap[1]);
        setPositions([...currentPositions]);

        if (index === mixingSequence.length - 1) {
          setTimeout(() => {
            const mixedCards = [...cards];
            if (currentTrial === 1) {
              // Trial normal - el comodín termina donde indican las animaciones
              const newCards = Array(4).fill(null).map((_, index) => ({
                id: index,
                isJoker: index === jokerFinalPosition,
                isFlipped: false
              }));
              setCards(newCards);
            } else if (currentTrial === 2) {
              // Trial de fracaso - eliminar el comodín
              mixedCards.forEach(card => card.isJoker = false);
              setCards(mixedCards);
            } else {
              // Trial de éxito - todos son comodín
              mixedCards.forEach(card => card.isJoker = true);
              setCards(mixedCards);
            }
            setIsMixing(false);
            setGameState('selection');
            setMessage('¡Encuentra el comodín!');
          }, 300);
        }
      }, index * swapTime);
    });
  };

  const handleCardClick = (cardId) => {
    if (gameState !== 'selection') return;

    const selectedCard = cards.find(card => card.id === cardId);
    const hasWon = selectedCard.isJoker;

    if (hasWon) {
      setMessage('¡Correcto! ¡Encontraste el comodín!');
      setScore(prev => ({ ...prev, wins: prev.wins + 1 }));
    } else {
      setMessage('¡Incorrecto! No era el comodín');
      setScore(prev => ({ ...prev, losses: prev.losses + 1 }));
    }

    setTimeout(() => {
      if (currentRound < ROUNDS_PER_TRIAL) {
        setCurrentRound(prev => prev + 1);
        resetForNextRound();
      } else if (currentTrial < 3) {
        setCurrentTrial(prev => prev + 1);
        setCurrentRound(1);
        resetForNextRound();
      } else {
        setMessage('¡Juego terminado!');
        setGameState('finished');
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <div className="text-xl font-bold mb-4">
        Trial {currentTrial} - Ronda {currentRound}/{ROUNDS_PER_TRIAL}
      </div>
      
      <div className="text-lg mb-4">{message}</div>
      
      <div className="relative w-full max-w-2xl h-48">
        {cards.map((card, index) => (
          <Card
            key={card.id}
            className={`absolute w-24 h-32 flex items-center justify-center cursor-pointer transition-all duration-300 transform ${
              gameState === 'selection' ? 'hover:scale-105' : ''
            } ${isMixing ? 'z-10' : ''}`}
            onClick={() => handleCardClick(card.id)}
            style={{
              transform: `translate(${positions[index]?.x}px, ${positions[index]?.y}px)`,
              backgroundColor: gameState === 'initial' ? 'white' : '#f8fafc'
            }}
          >
            <div className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}>
              {!isFlipped ? (
                <div className="text-4xl">
                  {card.isJoker ? '🃏' : '🎴'}
                </div>
              ) : (
                <div className="text-2xl font-bold">?</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {gameState === 'initial' && (
        <Button 
          onClick={flipCards}
          className="mt-4"
        >
          Voltear y Mezclar
        </Button>
      )}

      <div className="text-sm mt-4">
        Aciertos: {score.wins} | Fallos: {score.losses}
      </div>
    </div>
  );
};

export default CardGame;