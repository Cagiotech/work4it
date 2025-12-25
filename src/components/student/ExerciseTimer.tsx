import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Timer, Volume2, VolumeX, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExerciseTimerProps {
  restSeconds?: number;
  onTimerComplete?: () => void;
  compact?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  initialSeconds?: number;
}

export function ExerciseTimer({ 
  restSeconds = 60, 
  onTimerComplete, 
  compact = false,
  isOpen,
  onClose,
  initialSeconds
}: ExerciseTimerProps) {
  const effectiveRestSeconds = initialSeconds ?? restSeconds;
  const [timeLeft, setTimeLeft] = useState(effectiveRestSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio context for beep sound
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not supported on this device
    }
  }, [soundEnabled]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (mode === 'countdown') {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              playBeep();
              onTimerComplete?.();
              return 0;
            }
            // Beep at 3, 2, 1 seconds
            if (prev <= 4) {
              playBeep();
            }
            return prev - 1;
          });
        } else {
          setElapsedTime((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, onTimerComplete, playBeep]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'countdown') {
      setTimeLeft(effectiveRestSeconds);
    } else {
      setElapsedTime(0);
    }
  };

  const switchMode = (newMode: 'countdown' | 'stopwatch') => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'countdown') {
      setTimeLeft(effectiveRestSeconds);
    } else {
      setElapsedTime(0);
    }
  };

  // Reset timer when initialSeconds changes (dialog mode)
  useEffect(() => {
    if (isOpen && initialSeconds) {
      setTimeLeft(initialSeconds);
      setIsRunning(false);
    }
  }, [isOpen, initialSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTime = mode === 'countdown' ? timeLeft : elapsedTime;
  const progress = mode === 'countdown' 
    ? ((effectiveRestSeconds - timeLeft) / effectiveRestSeconds) * 100 
    : 0;

  const timerContent = (
    <div className="flex flex-col items-center space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'countdown' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchMode('countdown')}
        >
          <Timer className="h-4 w-4 mr-1" />
          Descanso
        </Button>
        <Button
          variant={mode === 'stopwatch' ? 'default' : 'outline'}
          size="sm"
          onClick={() => switchMode('stopwatch')}
        >
          <Timer className="h-4 w-4 mr-1" />
          Cronômetro
        </Button>
      </div>

      {/* Timer Display */}
      <div className="relative w-40 h-40">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          {mode === 'countdown' && (
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={`transition-all duration-1000 ${
                timeLeft <= 3 && isRunning 
                  ? 'text-red-500' 
                  : timeLeft <= 10 
                    ? 'text-yellow-500' 
                    : 'text-primary'
              }`}
              strokeLinecap="round"
            />
          )}
        </svg>
        
        {/* Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span 
            className={`text-4xl font-bold font-mono ${
              mode === 'countdown' && timeLeft <= 3 && isRunning 
                ? 'text-red-500 animate-pulse' 
                : ''
            }`}
          >
            {formatTime(displayTime)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {mode === 'countdown' ? 'Descanso' : 'Tempo'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-9 w-9"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
        
        <Button
          variant={isRunning ? "outline" : "default"}
          size="lg"
          onClick={toggleTimer}
          className="w-24"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Iniciar
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={resetTimer}
          className="h-9 w-9"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Time Adjustments (for countdown only) */}
      {mode === 'countdown' && !isRunning && (
        <div className="flex gap-2">
          {[30, 45, 60, 90, 120].map((seconds) => (
            <Button
              key={seconds}
              variant={timeLeft === seconds ? "default" : "outline"}
              size="sm"
              className="text-xs px-2"
              onClick={() => setTimeLeft(seconds)}
            >
              {seconds}s
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  // Dialog mode
  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Cronómetro de Exercício
            </DialogTitle>
          </DialogHeader>
          {timerContent}
        </DialogContent>
      </Dialog>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={isRunning ? "default" : "secondary"}
          className={`font-mono text-sm px-2 py-1 ${
            mode === 'countdown' && timeLeft <= 3 && isRunning 
              ? 'animate-pulse bg-red-500' 
              : ''
          }`}
        >
          {formatTime(displayTime)}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={resetTimer}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {timerContent}
      </CardContent>
    </Card>
  );
}
