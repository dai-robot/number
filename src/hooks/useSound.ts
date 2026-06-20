"use client";

import { soundEngine } from "@/lib/sound";
import { useCallback, useEffect, useState } from "react";

export function useSound() {
  const [muted, setMuted] = useState(false);
  const [bgmOn, setBgmOn] = useState(true);

  useEffect(() => {
    if (soundEngine) {
      setMuted(soundEngine.isMuted);
      setBgmOn(soundEngine.isBgmOn);
    }
  }, []);

  const init = useCallback(() => {
    soundEngine?.init();
  }, []);

  const toggleMute = useCallback(() => {
    const m = soundEngine?.toggleMute() ?? false;
    setMuted(m);
    return m;
  }, []);

  const toggleBgm = useCallback(() => {
    const b = soundEngine?.toggleBgm() ?? false;
    setBgmOn(b);
    return b;
  }, []);

  const playStart = useCallback(() => {
    soundEngine?.play("start");
  }, []);

  const playStop = useCallback(() => {
    soundEngine?.play("stop");
  }, []);

  const playTick = useCallback(() => {
    soundEngine?.play("tick");
  }, []);

  return { muted, bgmOn, init, toggleMute, toggleBgm, playStart, playStop, playTick };
}
