"""Invitoo · V1 · vía A: imagen→vídeo con Wan 2.2 TI2V 5B (Apache-2.0) en el ComfyUI local.

Uso (en el PC de Rodrigo, con ComfyUI abierto en http://127.0.0.1:8188):
  python wan_i2v.py encargos-video.json <fotogramas> <salida> [--solo a,b] [--orientacion v|h|vh]
                   [--pasos 20] [--frames 121] [--limite 480] [--baja]

  · Parte del primer fotograma FLUX (<fotogramas>/<id>-v.png / -h.png, de fotogramas.py).
  · Escribe <salida>/<id>-v.mp4 y <id>-h.mp4 (24 fps, 121 cuadros ≈ 5 s).
  · Mide el tiempo de cada clip y lo apunta en <salida>/tiempos.json.
  · --limite N (segundos): si el PRIMER clip tarda más de N, para y lo dice
    (la vía B, cine.py, sigue valiendo). Por defecto 480 s = 8 min.
  · --baja: 480×864 en vez de 704×1280 (unas 2,5 veces más rápido en 8 GB);
    cine.py lo reescala a 720×1280.

Modelos (models/…), de https://huggingface.co/Comfy-Org:
  diffusion_models/wan2.2_ti2v_5B_fp16.safetensors   (~10,0 GB, Apache-2.0, Wan-AI/Wan2.2-TI2V-5B)
  text_encoders/umt5_xxl_fp8_e4m3fn_scaled.safetensors (~6,7 GB, Apache-2.0, google/umt5-xxl)
  vae/wan2.2_vae.safetensors                          (~1,4 GB, Apache-2.0)
"""
import json, sys, time, uuid, shutil, urllib.request
from pathlib import Path

URL = "http://127.0.0.1:8188"
COMFY = Path(r"C:\IA\ComfyUI\ComfyUI_windows_portable\ComfyUI")
args = sys.argv[1:]
def opt(k, d=None):
    return args[args.index(k) + 1] if k in args else d
cfg = json.load(open(args[0], encoding="utf8"))
fot, sal = Path(args[1]), Path(args[2]); sal.mkdir(parents=True, exist_ok=True)
solo = set(opt("--solo", "").split(",")) - {""}
orients = opt("--orientacion", "vh")
pasos, frames, limite = int(opt("--pasos", "20")), int(opt("--frames", "121")), float(opt("--limite", "480"))
baja = "--baja" in args


def subir(ruta):
    b = "----invitoo" + uuid.uuid4().hex
    datos = ruta.read_bytes()
    cuerpo = (f"--{b}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{ruta.name}\"\r\n"
              f"Content-Type: image/png\r\n\r\n").encode() + datos + (
              f"\r\n--{b}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\ntrue\r\n--{b}--\r\n").encode()
    req = urllib.request.Request(URL + "/upload/image", data=cuerpo,
                                 headers={"Content-Type": f"multipart/form-data; boundary={b}"})
    return json.load(urllib.request.urlopen(req))["name"]


def grafo(img, pos, neg, w, h, seed, nombre):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "wan2.2_ti2v_5B_fp16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors", "type": "wan", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "wan2.2_vae.safetensors"}},
        "4": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["1", 0], "shift": 8.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["2", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["2", 0]}},
        "7": {"class_type": "LoadImage", "inputs": {"image": img}},
        "8": {"class_type": "Wan22ImageToVideoLatent", "inputs": {"vae": ["3", 0], "start_image": ["7", 0], "width": w, "height": h, "length": frames, "batch_size": 1}},
        "9": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["8", 0],
                                                   "seed": seed, "steps": pasos, "cfg": 5.0, "sampler_name": "uni_pc", "scheduler": "simple", "denoise": 1.0}},
        "10": {"class_type": "VAEDecode", "inputs": {"samples": ["9", 0], "vae": ["3", 0]}},
        "11": {"class_type": "CreateVideo", "inputs": {"images": ["10", 0], "fps": 24}},
        "12": {"class_type": "SaveVideo", "inputs": {"video": ["11", 0], "filename_prefix": "invitoo-wan/" + nombre, "format": "mp4", "codec": "h264"}},
    }


def lanzar(g):
    req = urllib.request.Request(URL + "/prompt", data=json.dumps({"prompt": g}).encode(), headers={"Content-Type": "application/json"})
    pid = json.load(urllib.request.urlopen(req))["prompt_id"]
    while True:
        time.sleep(3)
        h = json.load(urllib.request.urlopen(f"{URL}/history/{pid}"))
        if pid in h:
            return h[pid]


tiempos_f = sal / "tiempos.json"
tiempos = json.loads(tiempos_f.read_text()) if tiempos_f.exists() else {}
primero = True
for e in cfg["encargos"]:
    if solo and e["id"] not in solo:
        continue
    for o in orients:
        final = sal / f"{e['id']}-{o}.mp4"
        src = fot / f"{e['id']}-{o}.png"
        if final.exists() or not src.exists():
            continue
        w, h = ((480, 864) if baja else (704, 1280)) if o == "v" else ((864, 480) if baja else (1280, 704))
        pos = f"{e['movimiento']}. {cfg['movimiento_sufijo']}"
        t = time.time()
        r = lanzar(grafo(subir(src), pos, cfg["movimiento_negativo"], w, h, e["semilla"], f"{e['id']}-{o}"))
        vids = [v for n in r["outputs"].values() for k in ("images", "videos", "gifs") for v in n.get(k, [])]
        if not vids:
            print("FALLO", final.name, json.dumps(r.get("status"))[:400], flush=True)
            continue
        v = vids[0]
        shutil.copy2(COMFY / "output" / v.get("subfolder", "") / v["filename"], final)
        dt = time.time() - t
        tiempos[final.name] = {"segundos": round(dt), "ancho": w, "alto": h, "frames": frames, "pasos": pasos}
        tiempos_f.write_text(json.dumps(tiempos, indent=1))
        print(f"OK {final.name} {dt:.0f} s", flush=True)
        if primero and dt > limite:
            print(f"DEMASIADO LENTO: {dt:.0f} s > {limite:.0f} s por clip. Se para la vía A; "
                  f"probad --baja o quedaos con la vía B (cine.py).", flush=True)
            sys.exit(3)
        primero = False
print("TERMINADO", flush=True)
