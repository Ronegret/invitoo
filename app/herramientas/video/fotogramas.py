"""Invitoo · V1 · primeros fotogramas (FLUX.2 klein 4B en el ComfyUI local).

Uso (en el PC de Rodrigo):
  python fotogramas.py encargos-video.json <destino> [--solo id1,id2] [--semilla +N] [--rehacer]
Guarda <destino>/<id>-v.png (832×1472) y <id>-h.png (1472×832). Salta lo que existe.
"""
import json, sys, time, shutil, urllib.request
from pathlib import Path

URL = "http://127.0.0.1:8188"
SALIDA_COMFY = Path(r"C:\IA\ComfyUI\ComfyUI_windows_portable\ComfyUI\output")
args = sys.argv[1:]
def opt(k, d=None):
    return args[args.index(k) + 1] if k in args else d
cfg = json.load(open(args[0], encoding="utf8"))
destino = Path(args[1]); destino.mkdir(parents=True, exist_ok=True)
solo = set(opt("--solo", "").split(",")) - {""}
delta = int(opt("--semilla", "0"))
rehacer = "--rehacer" in args

def grafo(prompt, w, h, seed, nombre):
    return {
        "70": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux-2-klein-4b.safetensors", "weight_dtype": "default"}},
        "71": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_4b_fp4_flux2.safetensors", "type": "flux2", "device": "default"}},
        "72": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "74": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["71", 0]}},
        "76": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["74", 0]}},
        "63": {"class_type": "CFGGuider", "inputs": {"cfg": 1, "model": ["70", 0], "positive": ["74", 0], "negative": ["76", 0]}},
        "61": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler"}},
        "62": {"class_type": "Flux2Scheduler", "inputs": {"steps": 4, "width": w, "height": h}},
        "66": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "73": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "64": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["73", 0], "guider": ["63", 0], "sampler": ["61", 0], "sigmas": ["62", 0], "latent_image": ["66", 0]}},
        "65": {"class_type": "VAEDecode", "inputs": {"samples": ["64", 0], "vae": ["72", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "invitoo-video/" + nombre, "images": ["65", 0]}},
    }

def generar(g, final):
    req = urllib.request.Request(URL + "/prompt", data=json.dumps({"prompt": g}).encode(), headers={"Content-Type": "application/json"})
    pid = json.load(urllib.request.urlopen(req))["prompt_id"]
    while True:
        time.sleep(1.5)
        h = json.load(urllib.request.urlopen(f"{URL}/history/{pid}"))
        if pid in h:
            break
    ims = [im for n in h[pid]["outputs"].values() for im in n.get("images", [])]
    if not ims:
        raise RuntimeError(json.dumps(h[pid].get("status"))[:300])
    im = ims[0]
    shutil.copy2(SALIDA_COMFY / im.get("subfolder", "") / im["filename"], final)

t0 = time.time()
for e in cfg["encargos"]:
    if solo and e["id"] not in solo:
        continue
    for o, (w, h) in (("v", (832, 1472)), ("h", (1472, 832))):
        final = destino / f"{e['id']}-{o}.png"
        if final.exists() and not rehacer:
            continue
        comp = cfg["fotograma_vertical"] if o == "v" else cfg["fotograma_horizontal"]
        prompt = f"{e['fotograma']}, {comp}. {cfg['fotograma_sufijo']}"
        t = time.time()
        try:
            generar(grafo(prompt, w, h, e["semilla"] + delta + (0 if o == "v" else 1), f"{e['id']}-{o}"), final)
            print(f"OK {final.name} {time.time()-t:.0f}s (total {time.time()-t0:.0f}s)", flush=True)
        except Exception as ex:
            print(f"FALLO {final.name}: {ex}", flush=True)
print("TERMINADO", f"{time.time()-t0:.0f}s", flush=True)
