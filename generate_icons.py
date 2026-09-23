import os
import math
import struct
import zlib
import subprocess
import shutil

def clamp(v):
    return max(0, min(255, int(round(v))))

def make_png(width, height, get_rgba):
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_rgba(x, y)
            raw.extend((clamp(r), clamp(g), clamp(b), clamp(a)))
    
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')

def generate_master_icon(size=512):
    cx = size / 2.0
    cy = size / 2.0
    
    # Rounded box bounds
    margin = size * 0.05
    box_w = size - 2 * margin
    radius = size * 0.22
    
    def sdf_box(px, py):
        # centered box
        x = abs(px - cx) - (box_w / 2 - radius)
        y = abs(py - cy) - (box_w / 2 - radius)
        outside_dist = math.hypot(max(x, 0), max(y, 0))
        inside_dist = min(max(x, y), 0)
        return outside_dist + inside_dist - radius

    # Circle (ring of Q)
    ring_cx = cx
    ring_cy = cy - size * 0.03
    r_outer = size * 0.28
    r_inner = size * 0.19
    
    # Checkmark segments
    # p1: (cx - size*0.11, ring_cy + size*0.01)
    # p2: (cx - size*0.02, ring_cy + size*0.10)
    # p3: (cx + size*0.13, ring_cy - size*0.09)
    def dist_seg(px, py, x1, y1, x2, y2):
        dx = x2 - x1
        dy = y2 - y1
        l2 = dx*dx + dy*dy
        if l2 == 0:
            return math.hypot(px - x1, py - y1)
        t = max(0.0, min(1.0, ((px - x1)*dx + (py - y1)*dy) / l2))
        proj_x = x1 + t * dx
        proj_y = y1 + t * dy
        return math.hypot(px - proj_x, py - proj_y)

    c_x1, c_y1 = cx - size * 0.11, ring_cy + size * 0.01
    c_x2, c_y2 = cx - size * 0.03, ring_cy + size * 0.09
    c_x3, c_y3 = cx + size * 0.13, ring_cy - size * 0.09
    check_thickness = size * 0.038

    # Tail of Q (angled pill/trapezoid from bottom right of ring)
    q_x1, q_y1 = ring_cx + size * 0.10, ring_cy + size * 0.10
    q_x2, q_y2 = ring_cx + size * 0.26, ring_cy + size * 0.27
    q_thickness = size * 0.042

    def sample(px, py):
        # 1. Background Rounded Box
        d_box = sdf_box(px, py)
        if d_box > 1.5:
            return (0, 0, 0, 0)
        
        box_alpha = max(0.0, min(1.0, 0.5 - d_box))
        
        # Background gradient: vibrant royal blue (37, 99, 235) to midnight navy (15, 23, 42)
        diag = (px + py) / (2 * size)
        bg_r = 30 * (1 - diag) + 15 * diag
        bg_g = 90 * (1 - diag) + 23 * diag
        bg_b = 230 * (1 - diag) + 55 * diag

        # Subtle inner glow / border
        if -4.0 < d_box < 0:
            border_t = (-d_box) / 4.0
            bg_r = bg_r * border_t + 100 * (1 - border_t)
            bg_g = bg_g * border_t + 180 * (1 - border_t)
            bg_b = bg_b * border_t + 255 * (1 - border_t)

        # 2. Ring of Q
        d_ring_center = math.hypot(px - ring_cx, py - ring_cy)
        d_ring = max(d_ring_center - r_outer, r_inner - d_ring_center)
        ring_alpha = max(0.0, min(1.0, 0.5 - d_ring))

        # 3. Tail of Q
        d_tail = dist_seg(px, py, q_x1, q_y1, q_x2, q_y2) - q_thickness
        tail_alpha = max(0.0, min(1.0, 0.5 - d_tail))

        # Union of ring and tail
        q_alpha = max(ring_alpha, tail_alpha)

        # 4. Checkmark inside
        d_chk1 = dist_seg(px, py, c_x1, c_y1, c_x2, c_y2) - check_thickness
        d_chk2 = dist_seg(px, py, c_x2, c_y2, c_x3, c_y3) - check_thickness
        d_chk = min(d_chk1, d_chk2)
        chk_alpha = max(0.0, min(1.0, 0.5 - d_chk))

        # Combine colors
        # Base background
        r, g, b, a = bg_r, bg_g, bg_b, box_alpha * 255

        # Render Q shape: bright cyan to emerald gradient (quest & success)
        if q_alpha > 0:
            q_t = (py - (cy - r_outer)) / (2 * r_outer + q_thickness)
            qr = 240 * (1 - q_t) + 52 * q_t
            qg = 250 * (1 - q_t) + 211 * q_t
            qb = 255 * (1 - q_t) + 153 * q_t
            
            # Blend Q over background
            blend_q = q_alpha * (box_alpha)
            r = r * (1 - blend_q) + qr * blend_q
            g = g * (1 - blend_q) + qg * blend_q
            b = b * (1 - blend_q) + qb * blend_q

        # Render Checkmark: pure brilliant white with emerald hue
        if chk_alpha > 0:
            blend_chk = chk_alpha * box_alpha
            r = r * (1 - blend_chk) + 255 * blend_chk
            g = g * (1 - blend_chk) + 255 * blend_chk
            b = b * (1 - blend_chk) + 255 * blend_chk

        return (r, g, b, a)

    # 2x2 super-sampling for anti-aliasing
    def get_rgba(x, y):
        samples = [
            sample(x + 0.25, y + 0.25),
            sample(x + 0.75, y + 0.25),
            sample(x + 0.25, y + 0.75),
            sample(x + 0.75, y + 0.75)
        ]
        r = sum(s[0] for s in samples) / 4.0
        g = sum(s[1] for s in samples) / 4.0
        b = sum(s[2] for s in samples) / 4.0
        a = sum(s[3] for s in samples) / 4.0
        return (r, g, b, a)

    return make_png(size, size, get_rgba)

def make_ico(png_files_with_sizes):
    # ICO file format:
    # ICONDIR: 0, 1 (icon type), count
    # ICONDIRENTRY for each: width, height, colors, reserved, planes, bpp, bytes_in_res, image_offset
    count = len(png_files_with_sizes)
    header = struct.pack('<HHH', 0, 1, count)
    entries = []
    offset = 6 + count * 16
    data_blobs = []
    
    for size, data in png_files_with_sizes:
        w = size if size < 256 else 0
        h = size if size < 256 else 0
        size_bytes = len(data)
        entry = struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, size_bytes, offset)
        entries.append(entry)
        data_blobs.append(data)
        offset += size_bytes
        
    return header + b''.join(entries) + b''.join(data_blobs)

def main():
    icons_dir = "src-tauri/icons"
    os.makedirs(icons_dir, exist_ok=True)
    os.makedirs("public", exist_ok=True)
    
    print("Generating master 512x512 icon...")
    master_png = generate_master_icon(512)
    
    # Save master
    with open("app-icon.png", "wb") as f:
        f.write(master_png)
    shutil.copyfile("app-icon.png", "public/app-icon.png")
    shutil.copyfile("app-icon.png", f"{icons_dir}/icon.png")
    print("Saved app-icon.png and public/app-icon.png")

    # Generate various sizes using sips
    sizes = {
        "32x32.png": (32, 32),
        "128x128.png": (128, 128),
        "128x128@2x.png": (256, 256),
        "Square30x30Logo.png": (30, 30),
        "Square44x44Logo.png": (44, 44),
        "Square71x71Logo.png": (71, 71),
        "Square89x89Logo.png": (89, 89),
        "Square107x107Logo.png": (107, 107),
        "Square142x142Logo.png": (142, 142),
        "Square150x150Logo.png": (150, 150),
        "Square284x284Logo.png": (284, 284),
        "Square310x310Logo.png": (310, 310),
        "StoreLogo.png": (50, 50),
    }

    for name, (w, h) in sizes.items():
        out_path = f"{icons_dir}/{name}"
        subprocess.run(["sips", "-z", str(h), str(w), "app-icon.png", "--out", out_path], check=True, stdout=subprocess.DEVNULL)
    print("Generated all resized PNG icons.")

    # Generate ICNS using iconutil
    iconset_dir = "icon.iconset"
    os.makedirs(iconset_dir, exist_ok=True)
    
    icns_sizes = [
        ("icon_16x16.png", 16),
        ("icon_16x16@2x.png", 32),
        ("icon_32x32.png", 32),
        ("icon_32x32@2x.png", 64),
        ("icon_128x128.png", 128),
        ("icon_128x128@2x.png", 256),
        ("icon_256x256.png", 256),
        ("icon_256x256@2x.png", 512),
        ("icon_512x512.png", 512),
    ]
    for filename, sz in icns_sizes:
        subprocess.run(["sips", "-z", str(sz), str(sz), "app-icon.png", "--out", f"{iconset_dir}/{filename}"], check=True, stdout=subprocess.DEVNULL)
    
    subprocess.run(["iconutil", "-c", "icns", iconset_dir, "-o", f"{icons_dir}/icon.icns"], check=True)
    shutil.rmtree(iconset_dir)
    print("Generated src-tauri/icons/icon.icns")

    # Generate ICO file
    ico_entries = []
    tmp_dir = ".tmp_ico"
    os.makedirs(tmp_dir, exist_ok=True)
    for sz in [16, 32, 48, 64, 128, 256]:
        tmp_ico_png = f"{tmp_dir}/ico_{sz}.png"
        subprocess.run(["sips", "-z", str(sz), str(sz), "app-icon.png", "--out", tmp_ico_png], check=True, stdout=subprocess.DEVNULL)
        with open(tmp_ico_png, "rb") as f:
            ico_entries.append((sz, f.read()))
    shutil.rmtree(tmp_dir)

    ico_data = make_ico(ico_entries)
    with open(f"{icons_dir}/icon.ico", "wb") as f:
        f.write(ico_data)
    print("Generated src-tauri/icons/icon.ico")
    print("Icon generation complete!")

if __name__ == "__main__":
    main()
