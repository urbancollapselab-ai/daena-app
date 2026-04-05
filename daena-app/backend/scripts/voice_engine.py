#!/usr/bin/env python3
"""
Daena Voice Engine v4.0 (Azure Neural Free Tier via edge-tts)
=============================================================
Provides highly professional, ultra-realistic human voices for Daena
without any API cost using Microsoft Edge's Neural TTS endpoints.

Usage:
    engine = VoiceEngine()
    engine.speak("Hoş geldiniz, ben Daena.")
"""

import asyncio
import os
import tempfile
from pathlib import Path
try:
    import edge_tts
    import simpleaudio as sa
except ImportError:
    edge_tts = None
    sa = None

class VoiceEngine:
    def __init__(self, voice="tr-TR-EmelNeural"):
        self.voice = voice # tr-TR-EmelNeural (Female TR), en-US-AriaNeural (Female EN)
        self._temp_dir = Path(tempfile.gettempdir()) / "daena_voice"
        self._temp_dir.mkdir(parents=True, exist_ok=True)

    async def _generate_audio_file(self, text: str) -> str:
        """Generates MP3 audio using Edge Neural TTS."""
        if not edge_tts:
            raise ImportError("Please install 'edge-tts' and 'simpleaudio'")
            
        output_file = self._temp_dir / f"response_{hash(text)}.mp3"
        if not output_file.exists():
            communicate = edge_tts.Communicate(text, self.voice, rate="+10%")
            await communicate.save(str(output_file))
        return str(output_file)

    def speak(self, text: str):
        """Generates and plays the text audibly."""
        try:
            # Generate the file
            audio_path = asyncio.run(self._generate_audio_file(text))
            
            # Simpleaudio plays wav natively, to play mp3 easily on macOS:
            # using afplay on macOS
            if os.name == "posix":
                os.system(f"afplay '{audio_path}'")
            else:
                # Windows
                os.system(f"start '{audio_path}'")
                
        except Exception as e:
            print(f"[VoiceEngine] Audio failed: {e}")

if __name__ == "__main__":
    v = VoiceEngine()
    print("Test: Edge TTS Neural Voice (Turkish)")
    v.speak("Merhaba Vedat Bey, Sistemler analiz edildi ve tam kapasiteyle çalışıyor. Ben Daena, size nasıl yardımcı olabilirim?")
