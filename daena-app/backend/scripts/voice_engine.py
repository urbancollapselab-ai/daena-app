import platform
import subprocess

class VoiceEngine:
    """
    Local Voice Synthesis and Recognition Engine.
    Uses macOS NSSpeechSynthesizer / Windows SAPI for TTS to avoid massive ONNX models for now.
    """
    def __init__(self):
        self.os_type = platform.system()

    def speak(self, text: str):
        """Asynchronously speak the text using native OS TTS."""
        import threading
        t = threading.Thread(target=self._speak_sync, args=(text,))
        t.start()

    def _speak_sync(self, text: str):
        if self.os_type == "Darwin":
            # macOS native TTS (say)
            subprocess.run(["say", text])
        elif self.os_type == "Windows":
            # Windows native TTS via PowerShell
            script = f"""
            Add-Type -AssemblyName System.Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $synth.Speak('{text}')
            """
            subprocess.run(["powershell", "-Command", script])
        else:
            print(f"[VoiceEngine] TTS unsupported on {self.os_type}")

    def listen_command(self) -> str:
        """
        In production, this hooks into sherpa-onnx.
        For now, this returns a stub.
        """
        return ""
