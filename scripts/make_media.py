"""生成竖屏科普短片 + 封面图 (ffmpeg)。

所有路径都相对 public/media, 避免 Windows 盘符冒号破坏 filter 解析。
"""
import os
import subprocess

BASE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "media"))
TMP = os.path.join(BASE, "_tmp")
TXT = os.path.join(BASE, "_txt")
os.makedirs(TMP, exist_ok=True)

FONT_B = "C\\:/Windows/Fonts/msyhbd.ttc"
FONT_R = "C\\:/Windows/Fonts/msyh.ttc"
DUR = 5.0
XF = 0.6


def run(args):
    subprocess.run(args, check=True, cwd=BASE)


SLIDES = [
    ("t1.txt", "u1.txt", "健康小测验", "五个健康小问题", "先猜再看，答案在片尾"),
    ("t2.txt", "u2.txt", "心脑血管", "静息心率 60-100 次/分钟", "成年人安静状态下"),
    ("t3.txt", "u3.txt", "安全用药", "抗生素要吃完整个疗程", "按医嘱服用，不自行增减"),
    ("t4.txt", "u4.txt", "营养饮食", "每天蔬菜 300-500 克", "深色蔬菜占其中一半"),
    ("t5.txt", "u5.txt", "神经系统", "睡够 7-9 小时", "长期不足影响免疫与记忆"),
    ("t6.txt", "u6.txt", "骨骼健康", "负重运动 + 钙与维生素 D", "骨骼也需要负重刺激"),
]

# 1) 背景 (柔和竹青渐变)
run([
    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i",
    "gradients=s=720x1280:c0=0xF8FAF5:c1=0xD9E7DB:x0=90:y0=0:x1=630:y1=1280:d=1",
    "-frames:v", "1", "_tmp/bg.png",
])

# 2) 柔和圆斑 (透明 PNG)
run([
    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
    "-f", "lavfi", "-i", "color=c=black@0.0:s=520x520",
    "-vf", "format=rgba,geq=r='0':g='0':b='0':a='if(lt(pow(X-260,2)+pow(Y-260,2),pow(250,2)),20,0)'",
    "-frames:v", "1", "_tmp/circle.png",
])

clips = []
for i, (tf, uf, brand, title, sub) in enumerate(SLIDES):
    with open(os.path.join(TXT, f"b{i}.txt"), "w", encoding="utf-8") as f:
        f.write(brand)

    fade = "if(lt(t,0.9),t/0.9,if(gt(t,4.0),(5-t)/1.0,1))"
    vf = (
        f"[0:v]drawtext=fontfile='{FONT_B}':textfile='_txt/{tf}':"
        f"fontcolor=0x2A2F2B:fontsize=50:x=(w-text_w)/2:y=560:alpha='{fade}'[t];"
        f"[t]drawtext=fontfile='{FONT_R}':textfile='_txt/{uf}':"
        f"fontcolor=0x5A615C:fontsize=27:x=(w-text_w)/2:y=650:alpha='{fade}'[s];"
        f"[s]drawtext=fontfile='{FONT_R}':textfile='_txt/b{i}.txt':"
        f"fontcolor=0x4A6B52:fontsize=24:x=(w-text_w)/2:y=1010:alpha='{fade}'[br];"
        f"[br]drawtext=fontfile='{FONT_R}':textfile='_txt/brand.txt':"
        f"fontcolor=0x8A918B:fontsize=22:x=(w-text_w)/2:y=1120:alpha='{fade}'[b];"
        f"[b]drawbox=x=310:y=520:w=100:h=4:color=0x4A6B52@0.85:t=fill[bar];"
        f"[bar]drawbox=x=60:y=1180:w=600:h=2:color=0x2A2F2B@0.10:t=fill[ln];"
        f"[ln][1:v]overlay=x='if(lt(t,2.5),-70+52*t,60)':y='if(lt(t,2.5),-80+76*t,110)':"
        f"eval=frame,format=yuv420p[v]"
    )
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-loop", "1", "-i", "_tmp/bg.png", "-loop", "1", "-i", "_tmp/circle.png",
        "-filter_complex", vf, "-map", "[v]",
        "-t", str(DUR), "-r", "30", "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
        "-pix_fmt", "yuv420p", f"_tmp/seg{i}.mp4",
    ])
    clips.append(f"_tmp/seg{i}.mp4")

# 3) xfade 串接
args = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
for c in clips:
    args += ["-i", c]

chain = ""
prev = "[0:v]"
offset = DUR - XF
for i in range(1, len(clips)):
    out = f"[x{i}]"
    chain += f"{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={offset:.2f}{out};"
    prev = out
    offset += DUR - XF

args += [
    "-filter_complex", chain + "[x5]format=yuv420p[v]",
    "-map", "[v]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "27",
    "-profile:v", "main", "-level", "4.0", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-an", "health-brief.mp4",
]
run(args)

# 4) 封面
run([
    "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
    "-i", "health-brief.mp4", "-ss", "2.6", "-frames:v", "1", "-q:v", "3", "health-brief.jpg",
])

print("OK", os.path.getsize(os.path.join(BASE, "health-brief.mp4")))
