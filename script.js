/* --- "A CELESTIAL UNION" — GPU-DRIVEN DIGITAL WEDDING CARD ---
   A fixed WebGL2 canvas renders the whole scenery in real time:
     · a raymarched pair of interlocked 3D gold wedding rings (hero)
     · a domain-warped fBm nebula with aurora curtains
     · layered parallax starfields and shooting stars
     · a 15k-point additive particle field that reacts to the cursor,
       scroll, and celebratory "bursts" (entering the site, sending an RSVP)
   The DOM floats above it on blurred glass panels. */

// --- 1. DEFAULT DATA BACKUP & DATA INITIALIZATION ---
const SECRET_PASSCODE = "2026";
const DEFAULT_WISHES = [
    { name: "Jessica & Michael", attendance: "attending", wishes: "Congratulations! We are so excited to see you two tie the knot. Wishing you a lifetime of love and happiness!", timestamp: "2026-07-08 14:32:00" },
    { name: "Uncle David & Aunt Clara", attendance: "attending", wishes: "So happy to be there to witness your vows. Wishing you every blessing.", timestamp: "2026-07-06 09:12:00" },
    { name: "Sophia Martinez", attendance: "attending", wishes: "Sending you both the warmest wishes for the future. May your life together be filled with joy, adventure, and lots of laughter!", timestamp: "2026-07-05 18:45:00" }
];

function getRSVPs() {
    try {
        const list = localStorage.getItem("wedding_rsvps");
        return list ? JSON.parse(list) : [];
    } catch (e) {
        return [];
    }
}

function saveRSVPs(list) {
    try {
        localStorage.setItem("wedding_rsvps", JSON.stringify(list));
        return true;
    } catch (e) {
        return false;
    }
}

if (getRSVPs().length === 0) {
    saveRSVPs(DEFAULT_WISHES);
}

// --- 2. CONFIG LOAD & BINDING SYSTEM ---
const STORAGE_KEY = "wedding_custom_config";

function saveConfigToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) { /* storage full or unavailable */ }
}

function loadConfigFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(config, parsed);
            if (parsed.events) {
                config.events = config.events || {};
                Object.assign(config.events, parsed.events);
                if (parsed.events.ceremony) Object.assign(config.events.ceremony, parsed.events.ceremony);
                if (parsed.events.reception) Object.assign(config.events.reception, parsed.events.reception);
            }
        }
    } catch (e) { /* parse error or storage unavailable */ }
}

const config = window.WEDDING_CONFIG || {};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

// --- 3. WEBGL2 UNIVERSE ENGINE ---
const GLScene = (() => {
    const canvas = document.getElementById("gl-canvas");
    let gl = null;
    try {
        gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance"
        });
    } catch (e) {
        gl = null;
    }

    const stub = { ok: false, setPalette() { }, burstAt() { }, setScroll() { }, kick() { } };
    if (!gl) {
        document.body.classList.add("no-webgl");
        return stub;
    }

    // ---- Shaders -----------------------------------------------------------
    const QUAD_VERT = `#version 300 es
layout(location = 0) in vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

    // Background: nebula + aurora + stars + raymarched interlocked rings.
    const BG_FRAG = `#version 300 es
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_ringMix;
uniform vec2  u_mouse;
uniform vec3  u_colA;
uniform vec3  u_colB;
uniform vec3  u_colC;
uniform float u_motion;

out vec4 fragColor;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
        v += a * vnoise(p);
        p = m * p;
        a *= 0.5;
    }
    return v;
}

float starField(vec2 uv, float scale, float t) {
    vec2 id = floor(uv * scale);
    vec2 gv = fract(uv * scale) - 0.5;
    float rnd = hash21(id);
    float exists = step(0.92, rnd);
    vec2 offs = vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5;
    float d = length(gv - offs * 0.7);
    float star = exists * smoothstep(0.09, 0.0, d);
    float tw = 0.55 + 0.45 * sin(t * (1.5 + rnd * 5.0) + rnd * 44.0);
    return star * tw;
}

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

// Two interlocked wedding bands, slowly tumbling.
float mapRings(vec3 p, float tt) {
    p.yz *= rot(0.45 + 0.12 * sin(tt * 0.21));
    p.xz *= rot(tt * 0.24);
    vec3 pa = p;
    pa.x += 0.62;
    float dA = sdTorus(pa, vec2(1.0, 0.13));
    vec3 pb = p;
    pb.x -= 0.62;
    pb.yz *= rot(1.5707963);
    float dB = sdTorus(pb, vec2(1.0, 0.13));
    return min(dA, dB);
}

vec3 ringNormal(vec3 p, float tt) {
    vec2 e = vec2(0.0025, 0.0);
    return normalize(vec3(
        mapRings(p + e.xyy, tt) - mapRings(p - e.xyy, tt),
        mapRings(p + e.yxy, tt) - mapRings(p - e.yxy, tt),
        mapRings(p + e.yyx, tt) - mapRings(p - e.yyx, tt)));
}

vec4 renderRings(vec2 v, float tt, out float glowOut) {
    vec3 ro = vec3(0.0, 0.0, 4.2);
    vec3 rd = normalize(vec3(v, -1.9));
    float t = 0.0;
    float glow = 0.0;
    float hit = -1.0;
    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = mapRings(p, tt);
        glow += exp(-d * 6.0) * 0.014;
        if (d < 0.0025) { hit = t; break; }
        t += d * 0.9;
        if (t > 9.0) { break; }
    }
    glowOut = glow;
    if (hit < 0.0) { return vec4(0.0); }
    vec3 p = ro + rd * hit;
    vec3 n = ringNormal(p, tt);
    vec3 l1 = normalize(vec3(0.6, 0.9, 0.5));
    vec3 l2 = normalize(vec3(-0.7, -0.25, 0.45));
    float diff = max(dot(n, l1), 0.0);
    float diff2 = max(dot(n, l2), 0.0) * 0.35;
    vec3 h = normalize(l1 - rd);
    float spec = pow(max(dot(n, h), 0.0), 48.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    vec3 col = u_colC * (0.16 + diff * 0.85 + diff2)
        + vec3(1.0, 0.96, 0.82) * spec * 1.5
        + u_colC * fres * 0.9
        + u_colB * smoothstep(-1.0, 1.0, n.y) * 0.22;
    return vec4(col, 1.0);
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = (frag - 0.5 * u_res) / u_res.y;
    float t = u_time * u_motion + 10.0;
    vec2 par = u_mouse * 0.04;

    // deep space base gradient
    vec3 col = mix(u_colA * 0.35, u_colA, smoothstep(-0.7, 0.8, uv.y + u_scroll * 0.4));

    // domain-warped nebula drifting with scroll
    vec2 q = uv * 1.35 + par + vec2(0.0, u_scroll * 1.6);
    float w = fbm(q * 2.1 - t * 0.015);
    float f = fbm(q + w * 1.6 + vec2(t * 0.012, -t * 0.008));
    vec3 neb = mix(u_colA, u_colB, smoothstep(0.35, 0.85, f));
    neb += u_colC * pow(max(f - 0.45, 0.0), 2.0) * 1.2;
    col = mix(col, neb, 0.75);

    // aurora curtains
    for (int k = 0; k < 3; k++) {
        float fk = float(k);
        float y0 = 0.42 - fk * 0.16 - u_scroll * 0.5;
        float wave = fbm(vec2(uv.x * (1.4 + fk * 0.5) + t * (0.02 + fk * 0.013), fk * 7.7)) - 0.5;
        float d = abs(uv.y - y0 - wave * 0.45);
        float curtain = exp(-d * (7.0 + fk * 3.0));
        col += u_colB * curtain * (0.22 - fk * 0.05);
        col += u_colC * curtain * curtain * 0.08;
    }

    // parallax star layers
    col += vec3(0.9, 0.95, 1.0) * starField(uv + par * 2.0, 14.0, t) * 0.8;
    col += vec3(0.9, 0.95, 1.0) * starField(uv + par * 3.5 + 3.7, 26.0, t * 1.3) * 0.5;
    col += u_colC * starField(uv + par * 5.0 + 9.2, 44.0, t * 0.8) * 0.4;

    // occasional shooting star
    {
        float cycle = 7.0;
        float T = floor(t / cycle);
        float ft = fract(t / cycle);
        float r0 = hash21(vec2(T, 1.0));
        float r1 = hash21(vec2(T, 2.0));
        if (r0 > 0.35) {
            vec2 s0 = vec2(mix(-0.9, 0.5, r1), mix(0.15, 0.48, r0));
            vec2 dir = normalize(vec2(0.85, -0.35));
            vec2 pos = s0 + dir * ft * 2.6;
            vec2 dv = uv - pos;
            float along = dot(dv, dir);
            float perp = abs(dot(dv, vec2(-dir.y, dir.x)));
            float fade = sin(3.14159 * ft);
            float streak = exp(-perp * 240.0) * exp(min(along, 0.0) * 9.0) * smoothstep(0.02, 0.0, along);
            col += vec3(1.0, 0.98, 0.9) * streak * fade * 0.9;
        }
    }

    // interlocked rings, visible while the hero is on screen
    if (u_ringMix > 0.003) {
        vec2 rv = (uv - vec2(0.0, 0.06) + par * 1.3) * 1.9;
        float glow;
        vec4 rings = renderRings(rv, t, glow);
        col = mix(col, rings.rgb, rings.a * u_ringMix);
        col += u_colC * glow * 0.8 * u_ringMix;
    }

    // scroll-driven cool tint, vignette, tone & grain
    col = mix(col, col * vec3(0.72, 0.78, 1.05) + u_colA * 0.05, u_scroll * 0.45);
    float vig = smoothstep(1.45, 0.35, length(uv * vec2(0.85, 1.1)));
    col *= mix(0.55, 1.0, vig);
    col = col / (1.0 + col * 0.35);
    col += (hash21(frag * 0.7 + fract(t) * 113.0) - 0.5) * 0.02;

    fragColor = vec4(col, 1.0);
}`;

    const PT_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec4 a_seed;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_scroll;
uniform float u_burstTime;
uniform vec2  u_burstPos;
uniform float u_motion;

out float v_alpha;
out float v_kind;

void main() {
    float t = u_time * u_motion + 40.0;
    float depth = 0.25 + a_seed.z * 0.75;
    float speed = (0.010 + 0.045 * a_seed.w) * (0.4 + depth);

    float y = fract(a_seed.y + t * speed + u_scroll * (0.35 + 0.45 * depth));
    float x = fract(a_seed.x + t * speed * 0.22 + 0.05 * sin(t * 0.25 + a_seed.y * 43.0));
    vec2 p = vec2(x, y) * 2.0 - 1.0;

    p.x += sin(t * (0.35 + a_seed.z * 0.9) + a_seed.x * 77.0) * 0.035 * depth;
    p += u_mouse * 0.10 * depth;

    // cursor repulsion
    vec2 asp = vec2(u_res.x / max(u_res.y, 1.0), 1.0);
    vec2 dm = (p - u_mouse) * asp;
    float dist2 = dot(dm, dm) + 0.0001;
    p += (dm / asp) * (0.045 * depth / (0.05 + dist2 * 16.0));

    // celebration burst shockwave
    float bt = u_time - u_burstTime;
    float burst = 0.0;
    if (bt > 0.0 && bt < 3.0) {
        float ease = exp(-bt * 1.9) * (1.0 - exp(-bt * 16.0));
        vec2 bd = (p - u_burstPos) * asp;
        float bl = length(bd) + 0.001;
        p += (bd / asp) / bl * ease * (0.2 + 0.8 * a_seed.w) * 0.8 / (0.35 + bl * 1.7);
        burst = ease / (0.25 + bl * 2.2);
    }

    gl_Position = vec4(p, 0.0, 1.0);

    float size = (1.4 + 5.2 * a_seed.w * a_seed.w) * depth * (u_res.y / 1050.0);
    size *= 1.0 + burst * 2.5;
    gl_PointSize = clamp(size, 0.7, 15.0);

    float tw = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(t * (0.7 + a_seed.z * 2.4) + a_seed.x * 95.0), 2.0);
    v_alpha = tw * (0.22 + 0.78 * depth) * (0.6 + burst * 1.8);
    v_kind = a_seed.w;
}`;

    const PT_FRAG = `#version 300 es
precision mediump float;
uniform vec3 u_colC;
in float v_alpha;
in float v_kind;
out vec4 fragColor;
void main() {
    vec2 q = gl_PointCoord - 0.5;
    float d = length(q);
    float m = smoothstep(0.5, 0.05, d);
    float core = smoothstep(0.18, 0.0, d);
    vec3 col = mix(u_colC, vec3(1.0, 0.98, 0.9), core * 0.85);
    col = mix(col, vec3(0.75, 0.85, 1.0), step(0.85, v_kind) * 0.6);
    fragColor = vec4(col * m * v_alpha, 1.0);
}`;

    // ---- Compile & link ------------------------------------------------------
    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    }

    function link(vsSrc, fsSrc) {
        const vs = compile(gl.VERTEX_SHADER, vsSrc);
        const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(p));
            return null;
        }
        return p;
    }

    const bgProg = link(QUAD_VERT, BG_FRAG);
    const ptProg = link(PT_VERT, PT_FRAG);
    if (!bgProg || !ptProg) {
        document.body.classList.add("no-webgl");
        return stub;
    }

    function uniformMap(prog, names) {
        const map = {};
        names.forEach(n => { map[n] = gl.getUniformLocation(prog, n); });
        return map;
    }

    const bgU = uniformMap(bgProg, ["u_res", "u_time", "u_scroll", "u_ringMix", "u_mouse", "u_colA", "u_colB", "u_colC", "u_motion"]);
    const ptU = uniformMap(ptProg, ["u_time", "u_res", "u_mouse", "u_scroll", "u_burstTime", "u_burstPos", "u_motion", "u_colC"]);

    // ---- Geometry --------------------------------------------------------
    const quadVAO = gl.createVertexArray();
    gl.bindVertexArray(quadVAO);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const isMobile = Math.min(window.screen.width, window.screen.height) < 768 || /Mobi|Android/i.test(navigator.userAgent);
    const COUNT = prefersReducedMotion ? 900 : (isMobile ? 4500 : 15000);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();

    const ptVAO = gl.createVertexArray();
    gl.bindVertexArray(ptVAO);
    const ptBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // ---- State -------------------------------------------------------------
    const pal = { a: [0.05, 0.045, 0.13], b: [0.13, 0.34, 0.44], c: [1.0, 0.78, 0.36] };
    const palTarget = { a: pal.a.slice(), b: pal.b.slice(), c: pal.c.slice() };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollCur = 0, scrollTarget = 0, ringCur = 1, ringTarget = 1;
    let burstTime = -100;
    const burstPos = [0, 0];
    let quality = 1;
    let ema = 16, frames = 0;
    const t0 = performance.now();
    let last = t0;
    let raf = null;

    function resize() {
        const dprCap = isMobile ? 1.5 : 1.8;
        const dpr = Math.min(window.devicePixelRatio || 1, dprCap) * quality;
        const w = Math.max(1, Math.floor(window.innerWidth * dpr));
        const h = Math.max(1, Math.floor(window.innerHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }

    function lerpPal(cur, target, k) {
        for (let i = 0; i < 3; i++) cur[i] += (target[i] - cur[i]) * k;
    }

    function render(t) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.disable(gl.BLEND);

        gl.useProgram(bgProg);
        gl.bindVertexArray(quadVAO);
        gl.uniform2f(bgU.u_res, canvas.width, canvas.height);
        gl.uniform1f(bgU.u_time, t);
        gl.uniform1f(bgU.u_scroll, scrollCur);
        gl.uniform1f(bgU.u_ringMix, ringCur);
        gl.uniform2f(bgU.u_mouse, mouse.x, mouse.y);
        gl.uniform3fv(bgU.u_colA, pal.a);
        gl.uniform3fv(bgU.u_colB, pal.b);
        gl.uniform3fv(bgU.u_colC, pal.c);
        gl.uniform1f(bgU.u_motion, prefersReducedMotion ? 0 : 1);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.useProgram(ptProg);
        gl.bindVertexArray(ptVAO);
        gl.uniform1f(ptU.u_time, t);
        gl.uniform2f(ptU.u_res, canvas.width, canvas.height);
        gl.uniform2f(ptU.u_mouse, mouse.x, mouse.y);
        gl.uniform1f(ptU.u_scroll, scrollCur);
        gl.uniform1f(ptU.u_burstTime, burstTime);
        gl.uniform2f(ptU.u_burstPos, burstPos[0], burstPos[1]);
        gl.uniform1f(ptU.u_motion, prefersReducedMotion ? 0 : 1);
        gl.uniform3fv(ptU.u_colC, pal.c);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.drawArrays(gl.POINTS, 0, COUNT);
        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);
    }

    function frame(now) {
        raf = requestAnimationFrame(frame);
        const t = (now - t0) / 1000;
        const dt = now - last;
        last = now;
        ema += (dt - ema) * 0.05;
        frames++;
        // adaptive quality: if the GPU can't keep up, shrink the render target
        if (frames % 45 === 0 && ema > 34 && quality > 0.45) {
            quality *= 0.75;
            resize();
        }
        // time-based smoothing so fades behave identically at any frame rate
        const dtSec = Math.min(dt, 200) / 1000;
        const kFast = 1 - Math.exp(-dtSec * 4.2);
        const kSoft = 1 - Math.exp(-dtSec * 2.4);
        mouse.x += (mouse.tx - mouse.x) * kFast;
        mouse.y += (mouse.ty - mouse.y) * kFast;
        scrollCur += (scrollTarget - scrollCur) * kFast;
        ringCur += (ringTarget - ringCur) * kFast;
        lerpPal(pal.a, palTarget.a, kSoft);
        lerpPal(pal.b, palTarget.b, kSoft);
        lerpPal(pal.c, palTarget.c, kSoft);
        render(t);
    }

    function renderStill() {
        resize();
        pal.a = palTarget.a.slice();
        pal.b = palTarget.b.slice();
        pal.c = palTarget.c.slice();
        scrollCur = scrollTarget;
        ringCur = ringTarget;
        render(12.0);
    }

    window.addEventListener("resize", () => {
        resize();
        if (prefersReducedMotion) renderStill();
    });

    if (hasFinePointer) {
        window.addEventListener("pointermove", (e) => {
            mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
        }, { passive: true });
    }

    document.addEventListener("visibilitychange", () => {
        if (prefersReducedMotion) return;
        if (document.hidden) {
            if (raf) cancelAnimationFrame(raf);
            raf = null;
        } else if (!raf) {
            last = performance.now();
            raf = requestAnimationFrame(frame);
        }
    });

    resize();
    if (prefersReducedMotion) {
        renderStill();
    } else {
        raf = requestAnimationFrame(frame);
    }

    return {
        ok: true,
        setPalette(theme) {
            palTarget.a = theme.colA.slice();
            palTarget.b = theme.colB.slice();
            palTarget.c = theme.colC.slice();
            if (prefersReducedMotion) renderStill();
        },
        setScroll(progress, ringMix) {
            scrollTarget = progress;
            ringTarget = ringMix;
        },
        burstAt(clientX, clientY) {
            burstPos[0] = (clientX / window.innerWidth) * 2 - 1;
            burstPos[1] = -((clientY / window.innerHeight) * 2 - 1);
            burstTime = (performance.now() - t0) / 1000;
        },
        kick() {
            if (prefersReducedMotion) renderStill();
        }
    };
})();

// --- 4. THEME PRESETS (UI variables + WebGL palette) ---
const THEMES = {
    "midnight-gold": { colA: [0.050, 0.045, 0.130], colB: [0.13, 0.34, 0.44], colC: [1.00, 0.78, 0.36] },
    "nebula-rose": { colA: [0.100, 0.030, 0.095], colB: [0.52, 0.15, 0.30], colC: [1.00, 0.64, 0.58] },
    "aurora-emerald": { colA: [0.018, 0.062, 0.055], colB: [0.06, 0.42, 0.30], colC: [0.94, 0.83, 0.45] },
    "royal-violet": { colA: [0.045, 0.030, 0.130], colB: [0.28, 0.17, 0.55], colC: [0.78, 0.74, 1.00] }
};

// Older saved configs may still reference the pre-redesign palette names.
const LEGACY_THEME_MAP = {
    "gold-cream": "midnight-gold",
    "emerald-gold": "aurora-emerald",
    "burgundy-rose": "nebula-rose",
    "royal-navy-silver": "royal-violet"
};

function applyThemePreset(preset) {
    preset = LEGACY_THEME_MAP[preset] || preset;
    if (!THEMES[preset]) preset = "midnight-gold";

    Array.from(document.body.classList).forEach(c => {
        if (c.indexOf("theme-") === 0) document.body.classList.remove(c);
    });
    document.body.classList.add(`theme-${preset}`);
    config.themePreset = preset;
    GLScene.setPalette(THEMES[preset]);

    const selector = document.getElementById("theme-preset");
    if (selector) selector.value = preset;
}

function loadConfigValues() {
    document.title = `${config.groomName} & ${config.brideName} - Wedding Invitation`;

    document.querySelectorAll(".couple-names").forEach(el => el.textContent = `${config.groomName} & ${config.brideName}`);
    document.querySelectorAll(".couple-names-mini").forEach(el => el.textContent = `${config.groomName} & ${config.brideName}`);

    const sealTextEl = document.querySelector(".seal-text");
    if (sealTextEl) sealTextEl.textContent = config.initials || `${config.groomName.charAt(0)} & ${config.brideName.charAt(0)}`;

    document.querySelectorAll(".invite-msg").forEach(el => el.textContent = config.cardInviteMsg);
    document.querySelectorAll(".invite-date").forEach(el => el.textContent = config.weddingDateText);
    document.querySelectorAll(".hero-date").forEach(el => {
        const d = new Date(config.countdownTarget);
        el.textContent = isNaN(d)
            ? config.weddingDateText
            : `${String(d.getDate()).padStart(2, '0')} . ${String(d.getMonth() + 1).padStart(2, '0')} . ${d.getFullYear()}`;
    });
    document.querySelectorAll(".marriage-date").forEach(el => el.textContent = `${config.weddingDateText} · ${config.events?.ceremony?.address.split(',').pop().trim()}`);

    const deadlineEl = document.querySelector(".rsvp-tagline");
    if (deadlineEl) deadlineEl.textContent = `Kindly respond by ${config.rsvpDeadlineText}`;

    const cer = config.events?.ceremony;
    if (cer) {
        const card = document.querySelectorAll(".event-card")[0];
        if (card) {
            card.querySelector("h3").textContent = cer.title;
            card.querySelector(".time").textContent = cer.time;
            card.querySelector(".venue").textContent = cer.venue;
            card.querySelector(".address").textContent = cer.address;
            const link = card.querySelector("a.event-btn");
            if (link) link.href = cer.mapLink;
        }
    }

    const rec = config.events?.reception;
    if (rec) {
        const card = document.querySelectorAll(".event-card")[1];
        if (card) {
            card.querySelector("h3").textContent = rec.title;
            card.querySelector(".time").textContent = rec.time;
            card.querySelector(".venue").textContent = rec.venue;
            card.querySelector(".address").textContent = rec.address;
            const link = card.querySelector("a.event-btn");
            if (link) link.href = rec.mapLink;
        }
    }

    applyThemePreset(config.themePreset || "midnight-gold");
}

// --- 5. LIVE CUSTOMIZER CONTROL DRAWER LOGIC ---
const customPanel = document.getElementById("customizer-panel");
const customToggle = document.getElementById("customizer-toggle");

if (customToggle) {
    customToggle.addEventListener("click", () => {
        customPanel.classList.toggle("active");
    });
}

function populateCustomizerInputs() {
    document.getElementById("input-groom").value = config.groomName;
    document.getElementById("input-bride").value = config.brideName;
    document.getElementById("input-date").value = config.weddingDateText;
    document.getElementById("input-deadline").value = config.rsvpDeadlineText;

    const cer = config.events?.ceremony;
    if (cer) {
        document.getElementById("input-cer-title").value = cer.title;
        document.getElementById("input-cer-time").value = cer.time;
        document.getElementById("input-cer-venue").value = cer.venue;
        document.getElementById("input-cer-addr").value = cer.address;
    }

    const rec = config.events?.reception;
    if (rec) {
        document.getElementById("input-rec-title").value = rec.title;
        document.getElementById("input-rec-time").value = rec.time;
        document.getElementById("input-rec-venue").value = rec.venue;
        document.getElementById("input-rec-addr").value = rec.address;
    }
}

function updateDetail(key, val) {
    config[key] = val;
    loadConfigValues();
    saveConfigToStorage();
}

function updateEventDetail(eventKey, detailKey, val) {
    if (!config.events[eventKey]) config.events[eventKey] = {};
    config.events[eventKey][detailKey] = val;
    loadConfigValues();
    saveConfigToStorage();
}

function updateTheme(val) {
    applyThemePreset(val);
    saveConfigToStorage();
}

function resetCustomization() {
    if (!confirm("Reset all customizations back to the original default values?")) return;
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(config, window.WEDDING_CONFIG);
    config.events = JSON.parse(JSON.stringify(window.WEDDING_CONFIG.events));
    loadConfigValues();
    populateCustomizerInputs();
}

function downloadNewConfig() {
    const backupObj = Object.assign({}, config);
    const fileContent = `// --- WEDDING DIGITAL CARD CONFIGURATION DATA ---
const WEDDING_CONFIG = ${JSON.stringify(backupObj, null, 4)};
window.WEDDING_CONFIG = WEDDING_CONFIG;
`;
    const blob = new Blob([fileContent], { type: 'text/javascript;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "config.js");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 6. ENTRY GATE (replaces the old envelope) ---
const entryOverlay = document.getElementById("entry-overlay");
const mainContent = document.getElementById("main-content");
const enterBtn = document.getElementById("enter-btn");
let hasEntered = false;

function enterSite() {
    if (hasEntered) return;
    hasEntered = true;

    GLScene.burstAt(window.innerWidth / 2, window.innerHeight / 2);
    entryOverlay.classList.add("leaving");
    document.body.classList.add("entered");
    mainContent.classList.remove("hidden");

    initSynthAndPlay();
    musicPlayer.play();
    startCountdown();
    initReveals();
    updateScrollUniforms();

    setTimeout(() => {
        if (entryOverlay.parentNode) entryOverlay.parentNode.removeChild(entryOverlay);
    }, 1400);
}

if (enterBtn) enterBtn.addEventListener("click", enterSite);

// --- 7. SCROLL → SHADER UNIFORMS + HERO PARALLAX ---
const heroInner = document.getElementById("hero-inner");

function updateScrollUniforms() {
    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, window.scrollY / maxScroll);
    const ringMix = 1 - Math.min(1, window.scrollY / (window.innerHeight * 0.85));
    GLScene.setScroll(progress, ringMix);

    if (heroInner && !prefersReducedMotion) {
        const y = Math.min(window.scrollY * 0.28, 340);
        heroInner.style.transform = `translate3d(0, ${y}px, 0)`;
        heroInner.style.opacity = String(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.8)));
    }
}

window.addEventListener("scroll", updateScrollUniforms, { passive: true });
window.addEventListener("resize", updateScrollUniforms);

// --- 8. SCROLL REVEALS (IntersectionObserver) ---
function initReveals() {
    const revealEls = document.querySelectorAll(".reveal");

    // stagger siblings inside grids for a cascading entrance
    document.querySelectorAll(".countdown-grid, .gallery-grid, .events-grid, .registry-logos").forEach(grid => {
        Array.from(grid.children).forEach((child, i) => {
            child.style.setProperty("--d", `${Math.min(i * 90, 450)}ms`);
        });
    });

    if (!("IntersectionObserver" in window)) {
        revealEls.forEach(el => el.classList.add("in"));
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
}

// --- 9. 3D TILT CARDS + CURSOR AURA ---
function initTilt() {
    if (!hasFinePointer || prefersReducedMotion) return;
    document.querySelectorAll("[data-tilt]").forEach(card => {
        card.addEventListener("pointermove", (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
            card.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
            card.style.setProperty("--mx", `${(px * 100 + 50).toFixed(1)}%`);
            card.style.setProperty("--my", `${(py * 100 + 50).toFixed(1)}%`);
        });
        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
        });
    });
}

function initCursorGlow() {
    if (!hasFinePointer || prefersReducedMotion) return;
    const glow = document.getElementById("cursor-glow");
    if (!glow) return;
    document.body.classList.add("aura-on");
    window.addEventListener("pointermove", (e) => {
        glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    }, { passive: true });
}

// --- 10. WEB AUDIO AMBIENT SYSTEM ---
let audioCtx = null;
let isMuted = true;
let synthIntervalId = null;
const musicToggle = document.getElementById("music-toggle");

class AmbientMusicPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentChordIndex = 0;
        this.step = 0;

        this.chords = [
            [65.41, 130.81, 164.81, 196.00, 246.94, 293.66, 329.63, 392.00], // Cmaj9
            [55.00, 110.00, 146.83, 164.81, 220.00, 261.63, 329.63, 392.00], // Am9
            [43.65, 87.31, 130.81, 174.61, 220.00, 261.63, 329.63, 440.00],  // Fmaj9
            [49.00, 98.00, 146.83, 196.00, 246.94, 293.66, 329.63, 392.00]   // G6/9
        ];
    }

    startScheduler() {
        if (synthIntervalId) clearInterval(synthIntervalId);
        synthIntervalId = setInterval(() => {
            if (!this.isPlaying) return;
            this.playStep();
        }, 400);
    }

    playStep() {
        const chord = this.chords[this.currentChordIndex];
        const now = audioCtx.currentTime;

        switch (this.step) {
            case 0:
                this.playTone(chord[0], now, 3.2, 0.08);
                this.playTone(chord[3], now, 0.8, 0.04);
                break;
            case 1:
                this.playTone(chord[5], now, 0.8, 0.03);
                break;
            case 2:
                this.playTone(chord[4], now, 0.8, 0.03);
                break;
            case 3:
                this.playTone(chord[6], now, 0.8, 0.04);
                break;
            case 4:
                this.playTone(chord[1], now, 2.5, 0.06);
                this.playTone(chord[3], now, 0.8, 0.04);
                break;
            case 5:
                this.playTone(chord[5], now, 0.8, 0.03);
                break;
            case 6:
                this.playTone(chord[7], now, 0.8, 0.05);
                break;
            case 7:
                this.playTone(chord[6], now, 0.8, 0.03);
                break;
        }

        this.step = (this.step + 1) % 8;
        if (this.step === 0) {
            this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
        }
    }

    playTone(frequency, startTime, duration, velocity = 0.05) {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const oscHelper = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, startTime);

        oscHelper.type = 'sine';
        oscHelper.frequency.setValueAtTime(frequency * 2, startTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(velocity, startTime + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(filter);
        oscHelper.connect(filter);

        const delay = audioCtx.createDelay();
        delay.delayTime.value = 0.3;
        const delayGain = audioCtx.createGain();
        delayGain.gain.value = 0.25;

        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(audioCtx.destination);

        osc.start(startTime);
        oscHelper.start(startTime);
        osc.stop(startTime + duration + 0.5);
        oscHelper.stop(startTime + duration + 0.5);
    }

    play() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        this.isPlaying = true;
        isMuted = false;
        musicToggle.classList.add("playing");
        this.startScheduler();
    }

    stop() {
        this.isPlaying = false;
        isMuted = true;
        musicToggle.classList.remove("playing");
        if (synthIntervalId) {
            clearInterval(synthIntervalId);
            synthIntervalId = null;
        }
    }
}

const musicPlayer = new AmbientMusicPlayer();

function initSynthAndPlay() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

musicToggle.addEventListener("click", () => {
    initSynthAndPlay();
    if (isMuted) {
        musicPlayer.play();
    } else {
        musicPlayer.stop();
    }
});

// --- 11. COUNTDOWN TIMER (with glow pulse on each tick) ---
function startCountdown() {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    let intervalId = null;

    function setNum(el, value) {
        if (el.textContent !== value) {
            el.textContent = value;
            el.classList.remove("tick");
            void el.offsetWidth; // restart the pulse animation
            el.classList.add("tick");
        }
    }

    function update() {
        const targetDate = new Date(config.countdownTarget || "2026-09-24T16:00:00").getTime();
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            document.getElementById("timer").innerHTML = `<p class="section-eyebrow">Forever begins</p><h2 class="section-title text-center">We Are Married!</h2><div class="elegant-line-sub"></div>`;
            if (intervalId) clearInterval(intervalId);
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setNum(daysEl, String(days).padStart(2, '0'));
        setNum(hoursEl, String(hours).padStart(2, '0'));
        setNum(minutesEl, String(minutes).padStart(2, '0'));
        setNum(secondsEl, String(seconds).padStart(2, '0'));
    }

    update();
    intervalId = setInterval(update, 1000);
}

// --- 12. PHOTO GALLERY LIGHTBOX ---
const galleryPhotos = [
    { url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop", caption: "Engagement Portrait Session" },
    { url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop", caption: "Our Favorite Nature Walks" },
    { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop", caption: "Coffee Shop Cozy Talks" },
    { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop", caption: "Eternity Smiles" },
    { url: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=1200&auto=format&fit=crop", caption: "Exploring Together" },
    { url: "https://images.unsplash.com/photo-1482575832494-771f74bf6857?q=80&w=1200&auto=format&fit=crop", caption: "Holding Hands into Tomorrow" }
];

let activeLightboxIndex = 0;
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");

function openLightbox(index) {
    activeLightboxIndex = index;
    lightbox.style.display = "flex";
    updateLightboxPic();
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.style.display = "none";
    document.body.style.overflow = "auto";
}

function changeLightboxPic(val) {
    activeLightboxIndex += val;
    if (activeLightboxIndex >= galleryPhotos.length) activeLightboxIndex = 0;
    if (activeLightboxIndex < 0) activeLightboxIndex = galleryPhotos.length - 1;
    updateLightboxPic();
}

function updateLightboxPic() {
    lightboxImg.src = galleryPhotos[activeLightboxIndex].url;
    lightboxCaption.textContent = galleryPhotos[activeLightboxIndex].caption;
}

document.addEventListener("keydown", (e) => {
    if (lightbox.style.display === "flex") {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") changeLightboxPic(-1);
        if (e.key === "ArrowRight") changeLightboxPic(1);
    }
});

// --- 13. RSVP SUBMISSIONS & GUESTBOOK WISHES WALL RENDER ---
function compileWishesWall() {
    const list = getRSVPs();
    const guestWall = document.getElementById("guestbook-wall");
    if (!guestWall) return;
    guestWall.innerHTML = "";

    const wishesList = list
        .filter(entry => entry.wishes && entry.wishes.trim() !== "")
        .reverse();

    if (wishesList.length === 0) {
        guestWall.innerHTML = `<div class="guestbook-empty">No messages shared yet. Leave your best wishes in the RSVP form!</div>`;
        return;
    }

    wishesList.forEach(entry => {
        const card = document.createElement("div");
        card.className = "wish-card";
        const timestamp = entry.timestamp ? entry.timestamp.split(" ")[0] : "";
        card.innerHTML = `
            <p class="wish-text">"${escapeHtml(entry.wishes)}"</p>
            <p class="wish-author">${escapeHtml(entry.name)}</p>
            <p class="wish-meta">${timestamp}</p>
        `;
        guestWall.appendChild(card);
    });
}

const attendanceRadios = document.getElementsByName("attendance");
const detailsDiv = document.getElementById("rsvp-details");
const guestCountSelect = document.getElementById("guest-count");
const dietPrefSelect = document.getElementById("diet-pref");

if (attendanceRadios.length) {
    attendanceRadios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            if (e.target.value === "declined") {
                detailsDiv.style.maxHeight = "0px";
                detailsDiv.style.opacity = "0";
                detailsDiv.style.overflow = "hidden";
                detailsDiv.style.marginTop = "0px";
                guestCountSelect.value = "1";
                dietPrefSelect.value = "none";
            } else {
                detailsDiv.style.maxHeight = "300px";
                detailsDiv.style.opacity = "1";
                detailsDiv.style.marginTop = "1.5rem";
            }
        });
    });
}

function handleRSVPSubmit(event) {
    event.preventDefault();

    const nameVal = document.getElementById("guest-name").value.trim();
    const emailVal = document.getElementById("guest-email").value.trim();
    const attendanceVal = document.querySelector('input[name="attendance"]:checked').value;
    const guestCountVal = parseInt(guestCountSelect.value, 10);
    const dietVal = dietPrefSelect.value;
    const wishesVal = document.getElementById("wishes").value.trim();

    if (!nameVal || !emailVal) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newRSVP = {
        name: nameVal,
        email: emailVal,
        attendance: attendanceVal,
        guests: attendanceVal === "attending" ? guestCountVal : 0,
        diet: attendanceVal === "attending" ? dietVal : "none",
        wishes: wishesVal,
        timestamp: formattedDate
    };

    const currentList = getRSVPs();
    currentList.push(newRSVP);
    const saved = saveRSVPs(currentList);

    // Best-effort delivery off of this guest's device, so the couple actually
    // receives the RSVP instead of it being stranded in local browser storage.
    if (config.rsvpWebhookUrl) {
        fetch(config.rsvpWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRSVP)
        }).catch(() => { /* non-blocking: RSVP still saved locally either way */ });
    }

    compileWishesWall();

    // a shower of golden particles from the submit button
    const submitBtn = document.querySelector(".rsvp-submit-btn");
    if (submitBtn) {
        const r = submitBtn.getBoundingClientRect();
        GLScene.burstAt(r.left + r.width / 2, r.top + r.height / 2);
    }

    const modalSuccessMsg = document.getElementById("rsvp-success-msg");
    if (!saved) {
        modalSuccessMsg.textContent = `${nameVal}, we couldn't save your RSVP on this device (your browser may be blocking storage). Please try again or reach out to us directly.`;
    } else if (attendanceVal === "attending") {
        modalSuccessMsg.textContent = `${nameVal}, your invitation acceptance has been joyfully received. We can't wait to celebrate with you!`;
    } else {
        modalSuccessMsg.textContent = `${nameVal}, thank you for letting us know. You will be missed, but we appreciate your warm thoughts!`;
    }

    document.getElementById("rsvp-modal").classList.add("active");

    document.getElementById("rsvp-form").reset();
    detailsDiv.style.maxHeight = "300px";
    detailsDiv.style.opacity = "1";
}

function closeRSVPModal() {
    document.getElementById("rsvp-modal").classList.remove("active");
}

// --- 14. CALENDAR GENERATION FOR OUTLOOK/APPLE ---
function escapeICSText(text) {
    return String(text || "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
}

function addToCalendar(type) {
    const evt = config.events?.[type];
    if (!evt) return;

    const title = `${config.groomName} and ${config.brideName} - ${evt.title}`;
    const description = "Please join us to celebrate our wedding!";
    const location = evt.address;
    const startDate = evt.startISO.replace(/[-:]/g, "");
    const endDate = evt.endISO.replace(/[-:]/g, "");

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Wedding Invitation//NONSGML v1.0//EN",
        "BEGIN:VEVENT",
        `UID:${type}-${startDate}-wedding-rsvp`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${escapeICSText(title)}`,
        `DESCRIPTION:${escapeICSText(description)}`,
        `LOCATION:${escapeICSText(location)}`,
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${type}_event.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- 15. ADMIN GUESTLIST DASHBOARD ---
const adminModal = document.getElementById("admin-modal");

function promptAdmin() {
    const code = prompt("Enter the secure Administrator Access Passcode:");
    if (code === null) return;

    if (code === (config.adminPasscode || SECRET_PASSCODE)) {
        openAdminModal();
    } else {
        alert("Incorrect administrator authentication code. Access Denied.");
    }
}

function openAdminModal() {
    renderAdminTable();
    adminModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeAdminModal() {
    adminModal.classList.remove("active");
    document.body.style.overflow = "auto";
}

function renderAdminTable() {
    const list = getRSVPs();
    const tbody = document.getElementById("rsvp-table-body");
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="font-style: italic;">No RSVP records registered yet.</td></tr>`;
        return;
    }

    list.forEach(entry => {
        const row = document.createElement("tr");
        const isAttending = entry.attendance === "attending";
        const statusBadge = isAttending
            ? `<span class="status-pill status-attending">Yes</span>`
            : `<span class="status-pill status-declined">No</span>`;

        row.innerHTML = `
            <td><strong>${escapeHtml(entry.name)}</strong></td>
            <td>${escapeHtml(entry.email)}</td>
            <td>${statusBadge}</td>
            <td>${isAttending ? entry.guests : "0"}</td>
            <td style="text-transform: capitalize;">${isAttending ? escapeHtml(entry.diet) : "N/A"}</td>
            <td><div style="max-height: 80px; overflow-y: auto; max-width: 250px;" title="${escapeHtml(entry.wishes)}">${escapeHtml(entry.wishes) || "-"}</div></td>
            <td>${escapeHtml(entry.timestamp || "")}</td>
        `;
        tbody.appendChild(row);
    });
}

function clearRSVPs() {
    if (confirm("Are you absolutely sure you want to delete all RSVP guest entries? This action is permanent!")) {
        saveRSVPs(DEFAULT_WISHES);
        renderAdminTable();
        compileWishesWall();
        alert("Database cleared and reset to sample entries.");
    }
}

function exportRSVPs() {
    const list = getRSVPs();
    let csvContent = "\ufeff";
    csvContent += "Guest Name,Email,Attending,Guests,Dietary Preference,Wishes,Timestamp\r\n";

    list.forEach(r => {
        const name = `"${r.name.replace(/"/g, '""')}"`;
        const email = `"${r.email.replace(/"/g, '""')}"`;
        const status = r.attendance === 'attending' ? "Yes" : "No";
        const guests = r.attendance === 'attending' ? r.guests : 0;
        const diet = r.attendance === 'attending' ? `"${r.diet.replace(/"/g, '""')}"` : "N/A";
        const wishes = `"${(r.wishes || '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
        const time = `"${r.timestamp || ''}"`;

        csvContent += `${name},${email},${status},${guests},${diet},${wishes},${time}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "wedding_rsvp_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility: simple regex HTML escaping to block cross-site inputs in comment boards
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- 16. KEYBOARD ACCESSIBILITY FOR CLICK-ONLY CONTROLS ---
function makeKeyboardActivatable(el, handler) {
    if (!el) return;
    el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handler(e);
        }
    });
}

makeKeyboardActivatable(document.getElementById("admin-trigger"), promptAdmin);
makeKeyboardActivatable(document.querySelector(".close-lightbox"), closeLightbox);

// --- 17. ONLOAD INITIALIZATIONS ---
window.addEventListener("DOMContentLoaded", () => {
    loadConfigFromStorage();   // Restore any saved customizations first
    loadConfigValues();
    populateCustomizerInputs();
    compileWishesWall();
    initTilt();
    initCursorGlow();
    updateScrollUniforms();
});
