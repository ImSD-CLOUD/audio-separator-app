import os
import subprocess
import sys
import shutil

def sanitize_filename(filepath):
    dirname = os.path.dirname(filepath)
    filename = os.path.basename(filepath)
    safe_name = filename.replace(" ", "_")
    safe_path = os.path.join(dirname, safe_name)

    if filepath != safe_path:
        shutil.copy(filepath, safe_path)
        print(f"Sanitized input copied to: {safe_path}")
    return safe_path, filepath != safe_path  # Return a flag if copied

def separate_audio(input_path, output_dir):
    input_path, was_copied = sanitize_filename(input_path)

    output_dir = os.path.abspath(output_dir)
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # ✅ Use the lighter model
    cmd = [
        "demucs",
        "--two-stems", "vocals",
        "--model", "demucs_quantized",  # ✅ Lighter model for Railway
        "-o", output_dir,
        input_path
    ]

    print(f"Running Demucs command: {' '.join(cmd)}")
    process = subprocess.run(cmd, capture_output=True, text=True)

    if process.returncode != 0:
        print(f"Demucs Error (stdout):\n{process.stdout}")
        print(f"Demucs Error (stderr):\n{process.stderr}")
        raise RuntimeError(f"Demucs separation failed with code {process.returncode}")

    print("Separation completed by Demucs.")

    filename_without_ext = os.path.splitext(os.path.basename(input_path))[0]
    separated_files_base_dir = os.path.join(output_dir, "demucs_quantized", filename_without_ext)

    vocals_path = os.path.join(separated_files_base_dir, "vocals.wav")
    instrumental_path = os.path.join(separated_files_base_dir, "accompaniment.wav")

    final_vocals_mp3 = os.path.join(output_dir, "vocals.mp3")
    final_instrumental_mp3 = os.path.join(output_dir, "instrumental.mp3")

    if os.path.exists(vocals_path):
        convert_wav_to_mp3(vocals_path, final_vocals_mp3)
        print(f"Converted vocals to MP3: {final_vocals_mp3}")
    else:
        raise FileNotFoundError(f"Vocals WAV file not found: {vocals_path}")

    if os.path.exists(instrumental_path):
        convert_wav_to_mp3(instrumental_path, final_instrumental_mp3)
        print(f"Converted instrumental to MP3: {final_instrumental_mp3}")
    else:
        raise FileNotFoundError(f"Instrumental WAV file not found: {instrumental_path}")

    if was_copied:
        os.remove(input_path)
        print(f"Deleted temporary sanitized file: {input_path}")

def convert_wav_to_mp3(input_wav_path, output_mp3_path):
    cmd = [
        "ffmpeg", "-i", input_wav_path,
        "-acodec", "libmp3lame",
        "-qscale:a", "2",
        output_mp3_path
    ]
    print(f"Running FFmpeg command: {' '.join(cmd)}")
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode != 0:
        print(f"FFmpeg Error (stdout):\n{process.stdout}")
        print(f"FFmpeg Error (stderr):\n{process.stderr}")
        raise RuntimeError(f"FFmpeg conversion failed for {input_wav_path} with code {process.returncode}")
    print(f"FFmpeg conversion successful for {input_wav_path} to {output_mp3_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python demucs_separate.py <input_audio_path> <output_directory>")
        sys.exit(1)

    input_file_path = sys.argv[1]
    output_destination_dir = sys.argv[2]

    try:
        separate_audio(input_file_path, output_destination_dir)
        print("Audio separation and conversion process completed successfully.")
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)
