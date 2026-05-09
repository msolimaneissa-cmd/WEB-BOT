'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Volume2, VolumeX, Volume1, SkipForward, Music, BookOpen } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Slider } from './ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import type { AudioTrack, CommunitySettings } from '@/lib/data';

export function AudioPlayer() {
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.2); // Start with a lower volume
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const firestore = useFirestore();

  const settingsDoc = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'community') : null, [firestore]);
  const { data: communitySettings } = useDoc<CommunitySettings>(settingsDoc);

  const audioMode = communitySettings?.audioMode || 'music';

  const tracksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "audioTracks"), where("type", "==", audioMode));
  }, [firestore, audioMode]);
  const { data: tracks, isLoading: tracksLoading } = useCollection<AudioTrack>(tracksQuery);

  const playRandomTrack = useCallback(() => {
    if (playlist.length === 0) return;
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * playlist.length);
    } while (playlist.length > 1 && randomIndex === currentTrackIndex);

    setCurrentTrackIndex(randomIndex);
    setCurrentTrack(playlist[randomIndex]);
  }, [playlist, currentTrackIndex]);

  useEffect(() => {
    if (tracks && tracks.length > 0) {
      setPlaylist(tracks);
    } else {
      setPlaylist([]);
    }
  }, [tracks]);

  useEffect(() => {
    // When the playlist is first loaded, immediately play a random track
    if (playlist.length > 0 && currentTrackIndex === -1) {
      playRandomTrack();
    }
  }, [playlist, playRandomTrack, currentTrackIndex]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (currentTrack) {
      audioElement.src = currentTrack.url;

      // Attempt to play immediately
      const attemptPlay = () => {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.log('Auto-play prevented by browser, waiting for user interaction:', error);
              setIsPlaying(false);
            });
        }
      };

      // Try to play immediately
      attemptPlay();

      // If auto-play is blocked, force play on first user interaction
      const forcePlayOnInteraction = () => {
        if (!isPlaying && audioElement.paused) {
          attemptPlay();
        }
      };

      // Add multiple event listeners for different interaction types
      const clickHandler = () => {
        forcePlayOnInteraction();
        document.removeEventListener('click', clickHandler);
      };

      const touchHandler = () => {
        forcePlayOnInteraction();
        document.removeEventListener('touchstart', touchHandler);
      };

      const keyHandler = () => {
        forcePlayOnInteraction();
        document.removeEventListener('keydown', keyHandler);
      };

      document.addEventListener('click', clickHandler);
      document.addEventListener('touchstart', touchHandler);
      document.addEventListener('keydown', keyHandler);

      return () => {
        document.removeEventListener('click', clickHandler);
        document.removeEventListener('touchstart', touchHandler);
        document.removeEventListener('keydown', keyHandler);
      };
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      if (audioElement.src) {
        audioElement.play().catch(() => setIsPlaying(false));
      } else if (playlist.length > 0) {
        playRandomTrack();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    playRandomTrack();
  }

  const handleEnded = () => {
    playRandomTrack();
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (tracksLoading || playlist.length === 0) {
    return null; // Don't render player if there's nothing to play
  }

  return (
    <>
      <audio ref={audioRef} onEnded={handleEnded} preload="auto" autoPlay />
      <div className="fixed bottom-4 left-[2%] md:left-4 z-50 flex items-center gap-2 p-2 glass rounded-2xl shadow-2xl bg-black/60 scale-90 sm:scale-100 origin-bottom-left transition-transform">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="hover:bg-primary/20 text-foreground hover:text-primary transition-colors h-8 w-8 md:h-10 md:w-10 rounded-xl"
              >
                {isPlaying ? <Volume2 className="h-4 w-4 md:h-5 md:w-5" /> : <VolumeX className="h-4 w-4 md:h-5 md:w-5" />}
                <span className="sr-only">Toggle Music</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextTrack}
                className="bg-card/50 border-border/70 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground h-9 w-9 md:h-10 md:w-10"
              >
                <SkipForward className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Next Track</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>المقطع التالي</p>
            </TooltipContent>
          </Tooltip>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-card/50 border-border/70 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground h-9 w-9 md:h-10 md:w-10"
              >
                <Volume1 className="h-4 w-4 md:h-5 md:w-5" />
                <span className="sr-only">Volume</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-2 bg-card/80 backdrop-blur-sm border-border">
              <Slider
                defaultValue={[volume]}
                max={1}
                step={0.05}
                onValueChange={handleVolumeChange}
                className="w-24"
                aria-label="Volume"
              />
            </PopoverContent>
          </Popover>

          <div className="bg-card/50 border border-border/70 text-primary backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center text-xs md:text-sm h-9 md:h-10">
            {audioMode === 'music' ? <Music className="w-4 h-4 me-2" /> : <BookOpen className="w-4 h-4 me-2" />}
            <span className="truncate max-w-[100px] md:max-w-[150px]">{currentTrack?.title || "لا يوجد مقطع"}</span>
          </div>
        </TooltipProvider>
      </div>
    </>
  );
}
