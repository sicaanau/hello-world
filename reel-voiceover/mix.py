"""Mix the Italian voice-over onto the reel: python3 mix.py <voice> <video> <out.mp4>"""
import json, subprocess, sys, os
voice, video, out = sys.argv[1:4]
here = os.path.dirname(os.path.abspath(__file__)); d = os.path.join(here, 'tts', voice)
dur = json.load(open(os.path.join(d, 'dur.json')))
START = {"l1": .15, "l2": 2.6, "l3": 4.0, "l4": 7.0, "l5": 9.0, "l6": 11.0, "l7": 12.7}
START["l8"] = max(14.7, START["l7"] + dur["l7"] + .05)
START["l9"] = START["l8"] + dur["l8"] + .04
VIDEO_END = 18.667
for k in sorted(START):                       # the schedule never overlaps lines and ends inside the video
    nxt = sorted(START).index(k) + 1
    end = START[k] + dur[k]
    lim = START[sorted(START)[nxt]] if nxt < len(START) else VIDEO_END
    assert end <= lim + 1e-3, f"{voice} {k} ends {end:.2f} after {lim:.2f}"
ids = sorted(START)
cmd = ['ffmpeg', '-y', '-v', 'error', '-i', video] + sum([['-i', os.path.join(d, f'{k}.wav')] for k in ids], [])
f = [f"[{i+1}:a]aresample=48000,aformat=channel_layouts=mono,adelay={int(START[k]*1000)}:all=1,volume=1.0[v{i}]" for i, k in enumerate(ids)]
f.append(''.join(f'[v{i}]' for i in range(len(ids))) + f"amix=inputs={len(ids)}:normalize=0,apad,atrim=0:{VIDEO_END},asplit=2[vo][key]")
f.append("[0:a:0]aresample=48000,volume=1.6[bed]")                                  # the bed is quiet (−33 dB mean): lift it a little
f.append("[bed][key]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=350[duck]")   # and duck it under the voice
f.append("[vo]pan=stereo|c0=c0|c1=c0,volume=1.0[vos]")
f.append(f"[duck][vos]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:{VIDEO_END}[a]")
cmd += ['-filter_complex', ';'.join(f), '-map', '0:v:0', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out]
subprocess.run(cmd, check=True); print(out, {k: round(START[k], 2) for k in ids})
