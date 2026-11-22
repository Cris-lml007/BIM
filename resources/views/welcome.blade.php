<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>{{ config('app.name', 'BIMNova') }}</title>

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- Bootstrap Icons (opcional para iconos) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">

    <!-- Bootstrap JS (para componentes interactivos) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Three.js -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
    <!-- GLTFLoader para cargar modelos 3D -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/loaders/GLTFLoader.js"></script>
    <!-- OrbitControls opcional si quieres rotación manual -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/OrbitControls.js"></script>

    <!-- AOS Library -->
    <link rel="stylesheet" href="https://unpkg.com/aos@2.3.1/dist/aos.css" />
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    <!-- Animaciones CSS -->
    <style>
        @keyframes loadBar {
            to {
                width: 100%;
            }
        }
    </style>

    <!-- Animate.css CDN para animaciones suaves -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />

    <!-- Styles / Scripts -->
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        {{-- @vite(['resources/css/app.css', 'resources/js/app.js']) --}}
    @else
        <style>
            /*! tailwindcss v4.0.7 | MIT License | https://tailwindcss.com */
            @layer theme {

                :root,
                :host {
                    --font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                    --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    --color-red-50: oklch(.971 .013 17.38);
                    --color-red-100: oklch(.936 .032 17.717);
                    --color-red-200: oklch(.885 .062 18.334);
                    --color-red-300: oklch(.808 .114 19.571);
                    --color-red-400: oklch(.704 .191 22.216);
                    --color-red-500: oklch(.637 .237 25.331);
                    --color-red-600: oklch(.577 .245 27.325);
                    --color-red-700: oklch(.505 .213 27.518);
                    --color-red-800: oklch(.444 .177 26.899);
                    --color-red-900: oklch(.396 .141 25.723);
                    --color-red-950: oklch(.258 .092 26.042);
                    --color-orange-50: oklch(.98 .016 73.684);
                    --color-orange-100: oklch(.954 .038 75.164);
                    --color-orange-200: oklch(.901 .076 70.697);
                    --color-orange-300: oklch(.837 .128 66.29);
                    --color-orange-400: oklch(.75 .183 55.934);
                    --color-orange-500: oklch(.705 .213 47.604);
                    --color-orange-600: oklch(.646 .222 41.116);
                    --color-orange-700: oklch(.553 .195 38.402);
                    --color-orange-800: oklch(.47 .157 37.304);
                    --color-orange-900: oklch(.408 .123 38.172);
                    --color-orange-950: oklch(.266 .079 36.259);
                    --color-amber-50: oklch(.987 .022 95.277);
                    --color-amber-100: oklch(.962 .059 95.617);
                    --color-amber-200: oklch(.924 .12 95.746);
                    --color-amber-300: oklch(.879 .169 91.605);
                    --color-amber-400: oklch(.828 .189 84.429);
                    --color-amber-500: oklch(.769 .188 70.08);
                    --color-amber-600: oklch(.666 .179 58.318);
                    --color-amber-700: oklch(.555 .163 48.998);
                    --color-amber-800: oklch(.473 .137 46.201);
                    --color-amber-900: oklch(.414 .112 45.904);
                    --color-amber-950: oklch(.279 .077 45.635);
                    --color-yellow-50: oklch(.987 .026 102.212);
                    --color-yellow-100: oklch(.973 .071 103.193);
                    --color-yellow-200: oklch(.945 .129 101.54);
                    --color-yellow-300: oklch(.905 .182 98.111);
                    --color-yellow-400: oklch(.852 .199 91.936);
                    --color-yellow-500: oklch(.795 .184 86.047);
                    --color-yellow-600: oklch(.681 .162 75.834);
                    --color-yellow-700: oklch(.554 .135 66.442);
                    --color-yellow-800: oklch(.476 .114 61.907);
                    --color-yellow-900: oklch(.421 .095 57.708);
                    --color-yellow-950: oklch(.286 .066 53.813);
                    --color-lime-50: oklch(.986 .031 120.757);
                    --color-lime-100: oklch(.967 .067 122.328);
                    --color-lime-200: oklch(.938 .127 124.321);
                    --color-lime-300: oklch(.897 .196 126.665);
                    --color-lime-400: oklch(.841 .238 128.85);
                    --color-lime-500: oklch(.768 .233 130.85);
                    --color-lime-600: oklch(.648 .2 131.684);
                    --color-lime-700: oklch(.532 .157 131.589);
                    --color-lime-800: oklch(.453 .124 130.933);
                    --color-lime-900: oklch(.405 .101 131.063);
                    --color-lime-950: oklch(.274 .072 132.109);
                    --color-green-50: oklch(.982 .018 155.826);
                    --color-green-100: oklch(.962 .044 156.743);
                    --color-green-200: oklch(.925 .084 155.995);
                    --color-green-300: oklch(.871 .15 154.449);
                    --color-green-400: oklch(.792 .209 151.711);
                    --color-green-500: oklch(.723 .219 149.579);
                    --color-green-600: oklch(.627 .194 149.214);
                    --color-green-700: oklch(.527 .154 150.069);
                    --color-green-800: oklch(.448 .119 151.328);
                    --color-green-900: oklch(.393 .095 152.535);
                    --color-green-950: oklch(.266 .065 152.934);
                    --color-emerald-50: oklch(.979 .021 166.113);
                    --color-emerald-100: oklch(.95 .052 163.051);
                    --color-emerald-200: oklch(.905 .093 164.15);
                    --color-emerald-300: oklch(.845 .143 164.978);
                    --color-emerald-400: oklch(.765 .177 163.223);
                    --color-emerald-500: oklch(.696 .17 162.48);
                    --color-emerald-600: oklch(.596 .145 163.225);
                    --color-emerald-700: oklch(.508 .118 165.612);
                    --color-emerald-800: oklch(.432 .095 166.913);
                    --color-emerald-900: oklch(.378 .077 168.94);
                    --color-emerald-950: oklch(.262 .051 172.552);
                    --color-teal-50: oklch(.984 .014 180.72);
                    --color-teal-100: oklch(.953 .051 180.801);
                    --color-teal-200: oklch(.91 .096 180.426);
                    --color-teal-300: oklch(.855 .138 181.071);
                    --color-teal-400: oklch(.777 .152 181.912);
                    --color-teal-500: oklch(.704 .14 182.503);
                    --color-teal-600: oklch(.6 .118 184.704);
                    --color-teal-700: oklch(.511 .096 186.391);
                    --color-teal-800: oklch(.437 .078 188.216);
                    --color-teal-900: oklch(.386 .063 188.416);
                    --color-teal-950: oklch(.277 .046 192.524);
                    --color-cyan-50: oklch(.984 .019 200.873);
                    --color-cyan-100: oklch(.956 .045 203.388);
                    --color-cyan-200: oklch(.917 .08 205.041);
                    --color-cyan-300: oklch(.865 .127 207.078);
                    --color-cyan-400: oklch(.789 .154 211.53);
                    --color-cyan-500: oklch(.715 .143 215.221);
                    --color-cyan-600: oklch(.609 .126 221.723);
                    --color-cyan-700: oklch(.52 .105 223.128);
                    --color-cyan-800: oklch(.45 .085 224.283);
                    --color-cyan-900: oklch(.398 .07 227.392);
                    --color-cyan-950: oklch(.302 .056 229.695);
                    --color-sky-50: oklch(.977 .013 236.62);
                    --color-sky-100: oklch(.951 .026 236.824);
                    --color-sky-200: oklch(.901 .058 230.902);
                    --color-sky-300: oklch(.828 .111 230.318);
                    --color-sky-400: oklch(.746 .16 232.661);
                    --color-sky-500: oklch(.685 .169 237.323);
                    --color-sky-600: oklch(.588 .158 241.966);
                    --color-sky-700: oklch(.5 .134 242.749);
                    --color-sky-800: oklch(.443 .11 240.79);
                    --color-sky-900: oklch(.391 .09 240.876);
                    --color-sky-950: oklch(.293 .066 243.157);
                    --color-blue-50: oklch(.97 .014 254.604);
                    --color-blue-100: oklch(.932 .032 255.585);
                    --color-blue-200: oklch(.882 .059 254.128);
                    --color-blue-300: oklch(.809 .105 251.813);
                    --color-blue-400: oklch(.707 .165 254.624);
                    --color-blue-500: oklch(.623 .214 259.815);
                    --color-blue-600: oklch(.546 .245 262.881);
                    --color-blue-700: oklch(.488 .243 264.376);
                    --color-blue-800: oklch(.424 .199 265.638);
                    --color-blue-900: oklch(.379 .146 265.522);
                    --color-blue-950: oklch(.282 .091 267.935);
                    --color-indigo-50: oklch(.962 .018 272.314);
                    --color-indigo-100: oklch(.93 .034 272.788);
                    --color-indigo-200: oklch(.87 .065 274.039);
                    --color-indigo-300: oklch(.785 .115 274.713);
                    --color-indigo-400: oklch(.673 .182 276.935);
                    --color-indigo-500: oklch(.585 .233 277.117);
                    --color-indigo-600: oklch(.511 .262 276.966);
                    --color-indigo-700: oklch(.457 .24 277.023);
                    --color-indigo-800: oklch(.398 .195 277.366);
                    --color-indigo-900: oklch(.359 .144 278.697);
                    --color-indigo-950: oklch(.257 .09 281.288);
                    --color-violet-50: oklch(.969 .016 293.756);
                    --color-violet-100: oklch(.943 .029 294.588);
                    --color-violet-200: oklch(.894 .057 293.283);
                    --color-violet-300: oklch(.811 .111 293.571);
                    --color-violet-400: oklch(.702 .183 293.541);
                    --color-violet-500: oklch(.606 .25 292.717);
                    --color-violet-600: oklch(.541 .281 293.009);
                    --color-violet-700: oklch(.491 .27 292.581);
                    --color-violet-800: oklch(.432 .232 292.759);
                    --color-violet-900: oklch(.38 .189 293.745);
                    --color-violet-950: oklch(.283 .141 291.089);
                    --color-purple-50: oklch(.977 .014 308.299);
                    --color-purple-100: oklch(.946 .033 307.174);
                    --color-purple-200: oklch(.902 .063 306.703);
                    --color-purple-300: oklch(.827 .119 306.383);
                    --color-purple-400: oklch(.714 .203 305.504);
                    --color-purple-500: oklch(.627 .265 303.9);
                    --color-purple-600: oklch(.558 .288 302.321);
                    --color-purple-700: oklch(.496 .265 301.924);
                    --color-purple-800: oklch(.438 .218 303.724);
                    --color-purple-900: oklch(.381 .176 304.987);
                    --color-purple-950: oklch(.291 .149 302.717);
                    --color-fuchsia-50: oklch(.977 .017 320.058);
                    --color-fuchsia-100: oklch(.952 .037 318.852);
                    --color-fuchsia-200: oklch(.903 .076 319.62);
                    --color-fuchsia-300: oklch(.833 .145 321.434);
                    --color-fuchsia-400: oklch(.74 .238 322.16);
                    --color-fuchsia-500: oklch(.667 .295 322.15);
                    --color-fuchsia-600: oklch(.591 .293 322.896);
                    --color-fuchsia-700: oklch(.518 .253 323.949);
                    --color-fuchsia-800: oklch(.452 .211 324.591);
                    --color-fuchsia-900: oklch(.401 .17 325.612);
                    --color-fuchsia-950: oklch(.293 .136 325.661);
                    --color-pink-50: oklch(.971 .014 343.198);
                    --color-pink-100: oklch(.948 .028 342.258);
                    --color-pink-200: oklch(.899 .061 343.231);
                    --color-pink-300: oklch(.823 .12 346.018);
                    --color-pink-400: oklch(.718 .202 349.761);
                    --color-pink-500: oklch(.656 .241 354.308);
                    --color-pink-600: oklch(.592 .249 .584);
                    --color-pink-700: oklch(.525 .223 3.958);
                    --color-pink-800: oklch(.459 .187 3.815);
                    --color-pink-900: oklch(.408 .153 2.432);
                    --color-pink-950: oklch(.284 .109 3.907);
                    --color-rose-50: oklch(.969 .015 12.422);
                    --color-rose-100: oklch(.941 .03 12.58);
                    --color-rose-200: oklch(.892 .058 10.001);
                    --color-rose-300: oklch(.81 .117 11.638);
                    --color-rose-400: oklch(.712 .194 13.428);
                    --color-rose-500: oklch(.645 .246 16.439);
                    --color-rose-600: oklch(.586 .253 17.585);
                    --color-rose-700: oklch(.514 .222 16.935);
                    --color-rose-800: oklch(.455 .188 13.697);
                    --color-rose-900: oklch(.41 .159 10.272);
                    --color-rose-950: oklch(.271 .105 12.094);
                    --color-slate-50: oklch(.984 .003 247.858);
                    --color-slate-100: oklch(.968 .007 247.896);
                    --color-slate-200: oklch(.929 .013 255.508);
                    --color-slate-300: oklch(.869 .022 252.894);
                    --color-slate-400: oklch(.704 .04 256.788);
                    --color-slate-500: oklch(.554 .046 257.417);
                    --color-slate-600: oklch(.446 .043 257.281);
                    --color-slate-700: oklch(.372 .044 257.287);
                    --color-slate-800: oklch(.279 .041 260.031);
                    --color-slate-900: oklch(.208 .042 265.755);
                    --color-slate-950: oklch(.129 .042 264.695);
                    --color-gray-50: oklch(.985 .002 247.839);
                    --color-gray-100: oklch(.967 .003 264.542);
                    --color-gray-200: oklch(.928 .006 264.531);
                    --color-gray-300: oklch(.872 .01 258.338);
                    --color-gray-400: oklch(.707 .022 261.325);
                    --color-gray-500: oklch(.551 .027 264.364);
                    --color-gray-600: oklch(.446 .03 256.802);
                    --color-gray-700: oklch(.373 .034 259.733);
                    --color-gray-800: oklch(.278 .033 256.848);
                    --color-gray-900: oklch(.21 .034 264.665);
                    --color-gray-950: oklch(.13 .028 261.692);
                    --color-zinc-50: oklch(.985 0 0);
                    --color-zinc-100: oklch(.967 .001 286.375);
                    --color-zinc-200: oklch(.92 .004 286.32);
                    --color-zinc-300: oklch(.871 .006 286.286);
                    --color-zinc-400: oklch(.705 .015 286.067);
                    --color-zinc-500: oklch(.552 .016 285.938);
                    --color-zinc-600: oklch(.442 .017 285.786);
                    --color-zinc-700: oklch(.37 .013 285.805);
                    --color-zinc-800: oklch(.274 .006 286.033);
                    --color-zinc-900: oklch(.21 .006 285.885);
                    --color-zinc-950: oklch(.141 .005 285.823);
                    --color-neutral-50: oklch(.985 0 0);
                    --color-neutral-100: oklch(.97 0 0);
                    --color-neutral-200: oklch(.922 0 0);
                    --color-neutral-300: oklch(.87 0 0);
                    --color-neutral-400: oklch(.708 0 0);
                    --color-neutral-500: oklch(.556 0 0);
                    --color-neutral-600: oklch(.439 0 0);
                    --color-neutral-700: oklch(.371 0 0);
                    --color-neutral-800: oklch(.269 0 0);
                    --color-neutral-900: oklch(.205 0 0);
                    --color-neutral-950: oklch(.145 0 0);
                    --color-stone-50: oklch(.985 .001 106.423);
                    --color-stone-100: oklch(.97 .001 106.424);
                    --color-stone-200: oklch(.923 .003 48.717);
                    --color-stone-300: oklch(.869 .005 56.366);
                    --color-stone-400: oklch(.709 .01 56.259);
                    --color-stone-500: oklch(.553 .013 58.071);
                    --color-stone-600: oklch(.444 .011 73.639);
                    --color-stone-700: oklch(.374 .01 67.558);
                    --color-stone-800: oklch(.268 .007 34.298);
                    --color-stone-900: oklch(.216 .006 56.043);
                    --color-stone-950: oklch(.147 .004 49.25);
                    --color-black: #000;
                    --color-white: #fff;
                    --spacing: .25rem;
                    --breakpoint-sm: 40rem;
                    --breakpoint-md: 48rem;
                    --breakpoint-lg: 64rem;
                    --breakpoint-xl: 80rem;
                    --breakpoint-2xl: 96rem;
                    --container-3xs: 16rem;
                    --container-2xs: 18rem;
                    --container-xs: 20rem;
                    --container-sm: 24rem;
                    --container-md: 28rem;
                    --container-lg: 32rem;
                    --container-xl: 36rem;
                    --container-2xl: 42rem;
                    --container-3xl: 48rem;
                    --container-4xl: 56rem;
                    --container-5xl: 64rem;
                    --container-6xl: 72rem;
                    --container-7xl: 80rem;
                    --text-xs: .75rem;
                    --text-xs--line-height: calc(1/.75);
                    --text-sm: .875rem;
                    --text-sm--line-height: calc(1.25/.875);
                    --text-base: 1rem;
                    --text-base--line-height: 1.5;
                    --text-lg: 1.125rem;
                    --text-lg--line-height: calc(1.75/1.125);
                    --text-xl: 1.25rem;
                    --text-xl--line-height: calc(1.75/1.25);
                    --text-2xl: 1.5rem;
                    --text-2xl--line-height: calc(2/1.5);
                    --text-3xl: 1.875rem;
                    --text-3xl--line-height: 1.2;
                    --text-4xl: 2.25rem;
                    --text-4xl--line-height: calc(2.5/2.25);
                    --text-5xl: 3rem;
                    --text-5xl--line-height: 1;
                    --text-6xl: 3.75rem;
                    --text-6xl--line-height: 1;
                    --text-7xl: 4.5rem;
                    --text-7xl--line-height: 1;
                    --text-8xl: 6rem;
                    --text-8xl--line-height: 1;
                    --text-9xl: 8rem;
                    --text-9xl--line-height: 1;
                    --font-weight-thin: 100;
                    --font-weight-extralight: 200;
                    --font-weight-light: 300;
                    --font-weight-normal: 400;
                    --font-weight-medium: 500;
                    --font-weight-semibold: 600;
                    --font-weight-bold: 700;
                    --font-weight-extrabold: 800;
                    --font-weight-black: 900;
                    --tracking-tighter: -.05em;
                    --tracking-tight: -.025em;
                    --tracking-normal: 0em;
                    --tracking-wide: .025em;
                    --tracking-wider: .05em;
                    --tracking-widest: .1em;
                    --leading-tight: 1.25;
                    --leading-snug: 1.375;
                    --leading-normal: 1.5;
                    --leading-relaxed: 1.625;
                    --leading-loose: 2;
                    --radius-xs: .125rem;
                    --radius-sm: .25rem;
                    --radius-md: .375rem;
                    --radius-lg: .5rem;
                    --radius-xl: .75rem;
                    --radius-2xl: 1rem;
                    --radius-3xl: 1.5rem;
                    --radius-4xl: 2rem;
                    --shadow-2xs: 0 1px #0000000d;
                    --shadow-xs: 0 1px 2px 0 #0000000d;
                    --shadow-sm: 0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a;
                    --shadow-md: 0 4px 6px -1px #0000001a, 0 2px 4px -2px #0000001a;
                    --shadow-lg: 0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a;
                    --shadow-xl: 0 20px 25px -5px #0000001a, 0 8px 10px -6px #0000001a;
                    --shadow-2xl: 0 25px 50px -12px #00000040;
                    --inset-shadow-2xs: inset 0 1px #0000000d;
                    --inset-shadow-xs: inset 0 1px 1px #0000000d;
                    --inset-shadow-sm: inset 0 2px 4px #0000000d;
                    --drop-shadow-xs: 0 1px 1px #0000000d;
                    --drop-shadow-sm: 0 1px 2px #00000026;
                    --drop-shadow-md: 0 3px 3px #0000001f;
                    --drop-shadow-lg: 0 4px 4px #00000026;
                    --drop-shadow-xl: 0 9px 7px #0000001a;
                    --drop-shadow-2xl: 0 25px 25px #00000026;
                    --ease-in: cubic-bezier(.4, 0, 1, 1);
                    --ease-out: cubic-bezier(0, 0, .2, 1);
                    --ease-in-out: cubic-bezier(.4, 0, .2, 1);
                    --animate-spin: spin 1s linear infinite;
                    --animate-ping: ping 1s cubic-bezier(0, 0, .2, 1)infinite;
                    --animate-pulse: pulse 2s cubic-bezier(.4, 0, .6, 1)infinite;
                    --animate-bounce: bounce 1s infinite;
                    --blur-xs: 4px;
                    --blur-sm: 8px;
                    --blur-md: 12px;
                    --blur-lg: 16px;
                    --blur-xl: 24px;
                    --blur-2xl: 40px;
                    --blur-3xl: 64px;
                    --perspective-dramatic: 100px;
                    --perspective-near: 300px;
                    --perspective-normal: 500px;
                    --perspective-midrange: 800px;
                    --perspective-distant: 1200px;
                    --aspect-video: 16/9;
                    --default-transition-duration: .15s;
                    --default-transition-timing-function: cubic-bezier(.4, 0, .2, 1);
                    --default-font-family: var(--font-sans);
                    --default-font-feature-settings: var(--font-sans--font-feature-settings);
                    --default-font-variation-settings: var(--font-sans--font-variation-settings);
                    --default-mono-font-family: var(--font-mono);
                    --default-mono-font-feature-settings: var(--font-mono--font-feature-settings);
                    --default-mono-font-variation-settings: var(--font-mono--font-variation-settings)
                }
            }

            @layer base {

                *,
                :after,
                :before,
                ::backdrop {
                    box-sizing: border-box;
                    border: 0 solid;
                    margin: 0;
                    padding: 0
                }

                ::file-selector-button {
                    box-sizing: border-box;
                    border: 0 solid;
                    margin: 0;
                    padding: 0
                }

                html,
                :host {
                    -webkit-text-size-adjust: 100%;
                    -moz-tab-size: 4;
                    tab-size: 4;
                    line-height: 1.5;
                    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
                    font-feature-settings: var(--default-font-feature-settings, normal);
                    font-variation-settings: var(--default-font-variation-settings, normal);
                    -webkit-tap-highlight-color: transparent
                }

                body {
                    line-height: inherit
                }

                hr {
                    height: 0;
                    color: inherit;
                    border-top-width: 1px
                }

                abbr:where([title]) {
                    -webkit-text-decoration: underline dotted;
                    text-decoration: underline dotted
                }

                h1,
                h2,
                h3,
                h4,
                h5,
                h6 {
                    font-size: inherit;
                    font-weight: inherit
                }

                a {
                    color: inherit;
                    -webkit-text-decoration: inherit;
                    text-decoration: inherit
                }

                b,
                strong {
                    font-weight: bolder
                }

                code,
                kbd,
                samp,
                pre {
                    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace);
                    font-feature-settings: var(--default-mono-font-feature-settings, normal);
                    font-variation-settings: var(--default-mono-font-variation-settings, normal);
                    font-size: 1em
                }

                small {
                    font-size: 80%
                }

                sub,
                sup {
                    vertical-align: baseline;
                    font-size: 75%;
                    line-height: 0;
                    position: relative
                }

                sub {
                    bottom: -.25em
                }

                sup {
                    top: -.5em
                }

                table {
                    text-indent: 0;
                    border-color: inherit;
                    border-collapse: collapse
                }

                :-moz-focusring {
                    outline: auto
                }

                progress {
                    vertical-align: baseline
                }

                summary {
                    display: list-item
                }

                ol,
                ul,
                menu {
                    list-style: none
                }

                img,
                svg,
                video,
                canvas,
                audio,
                iframe,
                embed,
                object {
                    vertical-align: middle;
                    display: block
                }

                img,
                video {
                    max-width: 100%;
                    height: auto
                }

                button,
                input,
                select,
                optgroup,
                textarea {
                    font: inherit;
                    font-feature-settings: inherit;
                    font-variation-settings: inherit;
                    letter-spacing: inherit;
                    color: inherit;
                    opacity: 1;
                    background-color: #0000;
                    border-radius: 0
                }

                ::file-selector-button {
                    font: inherit;
                    font-feature-settings: inherit;
                    font-variation-settings: inherit;
                    letter-spacing: inherit;
                    color: inherit;
                    opacity: 1;
                    background-color: #0000;
                    border-radius: 0
                }

                :where(select:is([multiple], [size])) optgroup {
                    font-weight: bolder
                }

                :where(select:is([multiple], [size])) optgroup option {
                    padding-inline-start: 20px
                }

                ::file-selector-button {
                    margin-inline-end: 4px
                }

                ::placeholder {
                    opacity: 1;
                    color: color-mix(in oklab, currentColor 50%, transparent)
                }

                textarea {
                    resize: vertical
                }

                ::-webkit-search-decoration {
                    -webkit-appearance: none
                }

                ::-webkit-date-and-time-value {
                    min-height: 1lh;
                    text-align: inherit
                }

                ::-webkit-datetime-edit {
                    display: inline-flex
                }

                ::-webkit-datetime-edit-fields-wrapper {
                    padding: 0
                }

                ::-webkit-datetime-edit {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-year-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-month-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-day-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-hour-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-minute-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-second-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-millisecond-field {
                    padding-block: 0
                }

                ::-webkit-datetime-edit-meridiem-field {
                    padding-block: 0
                }

                :-moz-ui-invalid {
                    box-shadow: none
                }

                button,
                input:where([type=button], [type=reset], [type=submit]) {
                    -webkit-appearance: button;
                    -moz-appearance: button;
                    appearance: button
                }

                ::file-selector-button {
                    -webkit-appearance: button;
                    -moz-appearance: button;
                    appearance: button
                }

                ::-webkit-inner-spin-button {
                    height: auto
                }

                ::-webkit-outer-spin-button {
                    height: auto
                }

                [hidden]:where(:not([hidden=until-found])) {
                    display: none !important
                }
            }

            @layer components;

            @layer utilities {
                .absolute {
                    position: absolute
                }

                .relative {
                    position: relative
                }

                .static {
                    position: static
                }

                .inset-0 {
                    inset: calc(var(--spacing)*0)
                }

                .-mt-\[4\.9rem\] {
                    margin-top: -4.9rem
                }

                .-mb-px {
                    margin-bottom: -1px
                }

                .mb-1 {
                    margin-bottom: calc(var(--spacing)*1)
                }

                .mb-2 {
                    margin-bottom: calc(var(--spacing)*2)
                }

                .mb-4 {
                    margin-bottom: calc(var(--spacing)*4)
                }

                .mb-6 {
                    margin-bottom: calc(var(--spacing)*6)
                }

                .-ml-8 {
                    margin-left: calc(var(--spacing)*-8)
                }

                .flex {
                    display: flex
                }

                .hidden {
                    display: none
                }

                .inline-block {
                    display: inline-block
                }

                .inline-flex {
                    display: inline-flex
                }

                .table {
                    display: table
                }

                .aspect-\[335\/376\] {
                    aspect-ratio: 335/376
                }

                .h-1 {
                    height: calc(var(--spacing)*1)
                }

                .h-1\.5 {
                    height: calc(var(--spacing)*1.5)
                }

                .h-2 {
                    height: calc(var(--spacing)*2)
                }

                .h-2\.5 {
                    height: calc(var(--spacing)*2.5)
                }

                .h-3 {
                    height: calc(var(--spacing)*3)
                }

                .h-3\.5 {
                    height: calc(var(--spacing)*3.5)
                }

                .h-14 {
                    height: calc(var(--spacing)*14)
                }

                .h-14\.5 {
                    height: calc(var(--spacing)*14.5)
                }

                .min-h-screen {
                    min-height: 100vh
                }

                .w-1 {
                    width: calc(var(--spacing)*1)
                }

                .w-1\.5 {
                    width: calc(var(--spacing)*1.5)
                }

                .w-2 {
                    width: calc(var(--spacing)*2)
                }

                .w-2\.5 {
                    width: calc(var(--spacing)*2.5)
                }

                .w-3 {
                    width: calc(var(--spacing)*3)
                }

                .w-3\.5 {
                    width: calc(var(--spacing)*3.5)
                }

                .w-\[448px\] {
                    width: 448px
                }

                .w-full {
                    width: 100%
                }

                .max-w-\[335px\] {
                    max-width: 335px
                }

                .max-w-none {
                    max-width: none
                }

                .flex-1 {
                    flex: 1
                }

                .shrink-0 {
                    flex-shrink: 0
                }

                .translate-y-0 {
                    --tw-translate-y: calc(var(--spacing)*0);
                    translate: var(--tw-translate-x)var(--tw-translate-y)
                }

                .transform {
                    transform: var(--tw-rotate-x)var(--tw-rotate-y)var(--tw-rotate-z)var(--tw-skew-x)var(--tw-skew-y)
                }

                .flex-col {
                    flex-direction: column
                }

                .flex-col-reverse {
                    flex-direction: column-reverse
                }

                .items-center {
                    align-items: center
                }

                .justify-center {
                    justify-content: center
                }

                .justify-end {
                    justify-content: flex-end
                }

                .gap-3 {
                    gap: calc(var(--spacing)*3)
                }

                .gap-4 {
                    gap: calc(var(--spacing)*4)
                }

                :where(.space-x-1>:not(:last-child)) {
                    --tw-space-x-reverse: 0;
                    margin-inline-start: calc(calc(var(--spacing)*1)*var(--tw-space-x-reverse));
                    margin-inline-end: calc(calc(var(--spacing)*1)*calc(1 - var(--tw-space-x-reverse)))
                }

                .overflow-hidden {
                    overflow: hidden
                }

                .rounded-full {
                    border-radius: 3.40282e38px
                }

                .rounded-sm {
                    border-radius: var(--radius-sm)
                }

                .rounded-t-lg {
                    border-top-left-radius: var(--radius-lg);
                    border-top-right-radius: var(--radius-lg)
                }

                .rounded-br-lg {
                    border-bottom-right-radius: var(--radius-lg)
                }

                .rounded-bl-lg {
                    border-bottom-left-radius: var(--radius-lg)
                }

                .border {
                    border-style: var(--tw-border-style);
                    border-width: 1px
                }

                .border-\[\#19140035\] {
                    border-color: #19140035
                }

                .border-\[\#e3e3e0\] {
                    border-color: #e3e3e0
                }

                .border-black {
                    border-color: var(--color-black)
                }

                .border-transparent {
                    border-color: #0000
                }

                .bg-\[\#1b1b18\] {
                    background-color: #1b1b18
                }

                .bg-\[\#FDFDFC\] {
                    background-color: #fdfdfc
                }

                .bg-\[\#dbdbd7\] {
                    background-color: #dbdbd7
                }

                .bg-\[\#fff2f2\] {
                    background-color: #fff2f2
                }

                .bg-white {
                    background-color: var(--color-white)
                }

                .p-6 {
                    padding: calc(var(--spacing)*6)
                }

                .px-5 {
                    padding-inline: calc(var(--spacing)*5)
                }

                .py-1 {
                    padding-block: calc(var(--spacing)*1)
                }

                .py-1\.5 {
                    padding-block: calc(var(--spacing)*1.5)
                }

                .py-2 {
                    padding-block: calc(var(--spacing)*2)
                }

                .pb-12 {
                    padding-bottom: calc(var(--spacing)*12)
                }

                .text-sm {
                    font-size: var(--text-sm);
                    line-height: var(--tw-leading, var(--text-sm--line-height))
                }

                .text-\[13px\] {
                    font-size: 13px
                }

                .leading-\[20px\] {
                    --tw-leading: 20px;
                    line-height: 20px
                }

                .leading-normal {
                    --tw-leading: var(--leading-normal);
                    line-height: var(--leading-normal)
                }

                .font-medium {
                    --tw-font-weight: var(--font-weight-medium);
                    font-weight: var(--font-weight-medium)
                }

                .text-\[\#1b1b18\] {
                    color: #1b1b18
                }

                .text-\[\#706f6c\] {
                    color: #706f6c
                }

                .text-\[\#F53003\],
                .text-\[\#f53003\] {
                    color: #f53003
                }

                .text-white {
                    color: var(--color-white)
                }

                .underline {
                    text-decoration-line: underline
                }

                .underline-offset-4 {
                    text-underline-offset: 4px
                }

                .opacity-100 {
                    opacity: 1
                }

                .shadow-\[0px_0px_1px_0px_rgba\(0\,0\,0\,0\.03\)\,0px_1px_2px_0px_rgba\(0\,0\,0\,0\.06\)\] {
                    --tw-shadow: 0px 0px 1px 0px var(--tw-shadow-color, #00000008), 0px 1px 2px 0px var(--tw-shadow-color, #0000000f);
                    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)
                }

                .shadow-\[inset_0px_0px_0px_1px_rgba\(26\,26\,0\,0\.16\)\] {
                    --tw-shadow: inset 0px 0px 0px 1px var(--tw-shadow-color, #1a1a0029);
                    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)
                }

                .\!filter {
                    filter: var(--tw-blur, )var(--tw-brightness, )var(--tw-contrast, )var(--tw-grayscale, )var(--tw-hue-rotate, )var(--tw-invert, )var(--tw-saturate, )var(--tw-sepia, )var(--tw-drop-shadow, ) !important
                }

                .filter {
                    filter: var(--tw-blur, )var(--tw-brightness, )var(--tw-contrast, )var(--tw-grayscale, )var(--tw-hue-rotate, )var(--tw-invert, )var(--tw-saturate, )var(--tw-sepia, )var(--tw-drop-shadow, )
                }

                .transition-all {
                    transition-property: all;
                    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
                    transition-duration: var(--tw-duration, var(--default-transition-duration))
                }

                .transition-opacity {
                    transition-property: opacity;
                    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));
                    transition-duration: var(--tw-duration, var(--default-transition-duration))
                }

                .delay-300 {
                    transition-delay: .3s
                }

                .duration-750 {
                    --tw-duration: .75s;
                    transition-duration: .75s
                }

                .not-has-\[nav\]\:hidden:not(:has(:is(nav))) {
                    display: none
                }

                .before\:absolute:before {
                    content: var(--tw-content);
                    position: absolute
                }

                .before\:top-0:before {
                    content: var(--tw-content);
                    top: calc(var(--spacing)*0)
                }

                .before\:top-1\/2:before {
                    content: var(--tw-content);
                    top: 50%
                }

                .before\:bottom-0:before {
                    content: var(--tw-content);
                    bottom: calc(var(--spacing)*0)
                }

                .before\:bottom-1\/2:before {
                    content: var(--tw-content);
                    bottom: 50%
                }

                .before\:left-\[0\.4rem\]:before {
                    content: var(--tw-content);
                    left: .4rem
                }

                .before\:border-l:before {
                    content: var(--tw-content);
                    border-left-style: var(--tw-border-style);
                    border-left-width: 1px
                }

                .before\:border-\[\#e3e3e0\]:before {
                    content: var(--tw-content);
                    border-color: #e3e3e0
                }

                @media (hover:hover) {
                    .hover\:border-\[\#1915014a\]:hover {
                        border-color: #1915014a
                    }

                    .hover\:border-\[\#19140035\]:hover {
                        border-color: #19140035
                    }

                    .hover\:border-black:hover {
                        border-color: var(--color-black)
                    }

                    .hover\:bg-black:hover {
                        background-color: var(--color-black)
                    }
                }

                @media (width>=64rem) {
                    .lg\:-mt-\[6\.6rem\] {
                        margin-top: -6.6rem
                    }

                    .lg\:mb-0 {
                        margin-bottom: calc(var(--spacing)*0)
                    }

                    .lg\:mb-6 {
                        margin-bottom: calc(var(--spacing)*6)
                    }

                    .lg\:-ml-px {
                        margin-left: -1px
                    }

                    .lg\:ml-0 {
                        margin-left: calc(var(--spacing)*0)
                    }

                    .lg\:block {
                        display: block
                    }

                    .lg\:aspect-auto {
                        aspect-ratio: auto
                    }

                    .lg\:w-\[438px\] {
                        width: 438px
                    }

                    .lg\:max-w-4xl {
                        max-width: var(--container-4xl)
                    }

                    .lg\:grow {
                        flex-grow: 1
                    }

                    .lg\:flex-row {
                        flex-direction: row
                    }

                    .lg\:justify-center {
                        justify-content: center
                    }

                    .lg\:rounded-t-none {
                        border-top-left-radius: 0;
                        border-top-right-radius: 0
                    }

                    .lg\:rounded-tl-lg {
                        border-top-left-radius: var(--radius-lg)
                    }

                    .lg\:rounded-r-lg {
                        border-top-right-radius: var(--radius-lg);
                        border-bottom-right-radius: var(--radius-lg)
                    }

                    .lg\:rounded-br-none {
                        border-bottom-right-radius: 0
                    }

                    .lg\:p-8 {
                        padding: calc(var(--spacing)*8)
                    }

                    .lg\:p-20 {
                        padding: calc(var(--spacing)*20)
                    }
                }

                @media (prefers-color-scheme:dark) {
                    .dark\:block {
                        display: block
                    }

                    .dark\:hidden {
                        display: none
                    }

                    .dark\:border-\[\#3E3E3A\] {
                        border-color: #3e3e3a
                    }

                    .dark\:border-\[\#eeeeec\] {
                        border-color: #eeeeec
                    }

                    .dark\:bg-\[\#0a0a0a\] {
                        background-color: #0a0a0a
                    }

                    .dark\:bg-\[\#1D0002\] {
                        background-color: #1d0002
                    }

                    .dark\:bg-\[\#3E3E3A\] {
                        background-color: #3e3e3a
                    }

                    .dark\:bg-\[\#161615\] {
                        background-color: #161615
                    }

                    .dark\:bg-\[\#eeeeec\] {
                        background-color: #eeeeec
                    }

                    .dark\:text-\[\#1C1C1A\] {
                        color: #1c1c1a
                    }

                    .dark\:text-\[\#A1A09A\] {
                        color: #a1a09a
                    }

                    .dark\:text-\[\#EDEDEC\] {
                        color: #ededec
                    }

                    .dark\:text-\[\#F61500\] {
                        color: #f61500
                    }

                    .dark\:text-\[\#FF4433\] {
                        color: #f43
                    }

                    .dark\:shadow-\[inset_0px_0px_0px_1px_\#fffaed2d\] {
                        --tw-shadow: inset 0px 0px 0px 1px var(--tw-shadow-color, #fffaed2d);
                        box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)
                    }

                    .dark\:before\:border-\[\#3E3E3A\]:before {
                        content: var(--tw-content);
                        border-color: #3e3e3a
                    }

                    @media (hover:hover) {
                        .dark\:hover\:border-\[\#3E3E3A\]:hover {
                            border-color: #3e3e3a
                        }

                        .dark\:hover\:border-\[\#62605b\]:hover {
                            border-color: #62605b
                        }

                        .dark\:hover\:border-white:hover {
                            border-color: var(--color-white)
                        }

                        .dark\:hover\:bg-white:hover {
                            background-color: var(--color-white)
                        }
                    }
                }

                @starting-style {
                    .starting\:translate-y-4 {
                        --tw-translate-y: calc(var(--spacing)*4);
                        translate: var(--tw-translate-x)var(--tw-translate-y)
                    }
                }

                @starting-style {
                    .starting\:translate-y-6 {
                        --tw-translate-y: calc(var(--spacing)*6);
                        translate: var(--tw-translate-x)var(--tw-translate-y)
                    }
                }

                @starting-style {
                    .starting\:opacity-0 {
                        opacity: 0
                    }
                }
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg)
                }
            }

            @keyframes ping {

                75%,
                to {
                    opacity: 0;
                    transform: scale(2)
                }
            }

            @keyframes pulse {
                50% {
                    opacity: .5
                }
            }

            @keyframes bounce {

                0%,
                to {
                    animation-timing-function: cubic-bezier(.8, 0, 1, 1);
                    transform: translateY(-25%)
                }

                50% {
                    animation-timing-function: cubic-bezier(0, 0, .2, 1);
                    transform: none
                }
            }

            @property --tw-translate-x {
                syntax: "*";
                inherits: false;
                initial-value: 0
            }

            @property --tw-translate-y {
                syntax: "*";
                inherits: false;
                initial-value: 0
            }

            @property --tw-translate-z {
                syntax: "*";
                inherits: false;
                initial-value: 0
            }

            @property --tw-rotate-x {
                syntax: "*";
                inherits: false;
                initial-value: rotateX(0)
            }

            @property --tw-rotate-y {
                syntax: "*";
                inherits: false;
                initial-value: rotateY(0)
            }

            @property --tw-rotate-z {
                syntax: "*";
                inherits: false;
                initial-value: rotateZ(0)
            }

            @property --tw-skew-x {
                syntax: "*";
                inherits: false;
                initial-value: skewX(0)
            }

            @property --tw-skew-y {
                syntax: "*";
                inherits: false;
                initial-value: skewY(0)
            }

            @property --tw-space-x-reverse {
                syntax: "*";
                inherits: false;
                initial-value: 0
            }

            @property --tw-border-style {
                syntax: "*";
                inherits: false;
                initial-value: solid
            }

            @property --tw-leading {
                syntax: "*";
                inherits: false
            }

            @property --tw-font-weight {
                syntax: "*";
                inherits: false
            }

            @property --tw-shadow {
                syntax: "*";
                inherits: false;
                initial-value: 0 0 #0000
            }

            @property --tw-shadow-color {
                syntax: "*";
                inherits: false
            }

            @property --tw-inset-shadow {
                syntax: "*";
                inherits: false;
                initial-value: 0 0 #0000
            }

            @property --tw-inset-shadow-color {
                syntax: "*";
                inherits: false
            }

            @property --tw-ring-color {
                syntax: "*";
                inherits: false
            }

            @property --tw-ring-shadow {
                syntax: "*";
                inherits: false;
                initial-value: 0 0 #0000
            }

            @property --tw-inset-ring-color {
                syntax: "*";
                inherits: false
            }

            @property --tw-inset-ring-shadow {
                syntax: "*";
                inherits: false;
                initial-value: 0 0 #0000
            }

            @property --tw-ring-inset {
                syntax: "*";
                inherits: false
            }

            @property --tw-ring-offset-width {
                syntax: "<length>";
                inherits: false;
                initial-value: 0
            }

            @property --tw-ring-offset-color {
                syntax: "*";
                inherits: false;
                initial-value: #fff
            }

            @property --tw-ring-offset-shadow {
                syntax: "*";
                inherits: false;
                initial-value: 0 0 #0000
            }

            @property --tw-blur {
                syntax: "*";
                inherits: false
            }

            @property --tw-brightness {
                syntax: "*";
                inherits: false
            }

            @property --tw-contrast {
                syntax: "*";
                inherits: false
            }

            @property --tw-grayscale {
                syntax: "*";
                inherits: false
            }

            @property --tw-hue-rotate {
                syntax: "*";
                inherits: false
            }

            @property --tw-invert {
                syntax: "*";
                inherits: false
            }

            @property --tw-opacity {
                syntax: "*";
                inherits: false
            }

            @property --tw-saturate {
                syntax: "*";
                inherits: false
            }

            @property --tw-sepia {
                syntax: "*";
                inherits: false
            }

            @property --tw-drop-shadow {
                syntax: "*";
                inherits: false
            }

            @property --tw-duration {
                syntax: "*";
                inherits: false
            }

            @property --tw-content {
                syntax: "*";
                inherits: false;
                initial-value: ""
            }
        </style>
    @endif
</head>

<body class="bg-dark text-white d-flex flex-column min-vh-100"
    style="background: linear-gradient(rgba(10, 10, 10, .88), rgba(0, 0, 0, .96)), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2500&auto=format&fit=crop') no-repeat center center fixed; background-size: cover;">

    <style>
        :root {
            --bim-primary: #0d6efd;
            --bim-dark: #101820;
            --bim-muted: #64748b;
        }

        html {
            scroll-behavior: smooth;
            scroll-padding-top: 90px;
        }

        body {
            overflow-x: hidden;
        }

        .site-header {
            background: rgba(8, 13, 22, .88);
            backdrop-filter: blur(14px);
        }

        .brand-mark {
            color: var(--bim-primary);
        }

        .hero-section {
            min-height: 82vh;
            padding: 5rem 0;
        }

        .hero-copy {
            max-width: 720px;
        }

        .hero-image {
            border: 1px solid rgba(255, 255, 255, .15);
            background: rgba(255, 255, 255, .06);
        }

        .section-kicker {
            color: var(--bim-primary);
            letter-spacing: .16em;
            font-size: .78rem;
            font-weight: 800;
            text-transform: uppercase;
        }

        .section-title {
            font-weight: 800;
            letter-spacing: -.035em;
        }

        .glass-card {
            background: rgba(25, 34, 47, .78);
            border: 1px solid rgba(255, 255, 255, .1);
            backdrop-filter: blur(10px);
        }

        .feature-icon {
            width: 58px;
            height: 58px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 16px;
            background: rgba(13, 110, 253, .15);
            color: #6ea8fe;
            font-size: 1.65rem;
        }

        .service-card,
        .step-card,
        .reason-card {
            transition: transform .25s ease, border-color .25s ease;
        }

        .service-card:hover,
        .step-card:hover,
        .reason-card:hover {
            transform: translateY(-6px);
            border-color: rgba(13, 110, 253, .65);
        }

        .soft-section {
            background: #f8fafc;
            color: #172033;
        }

        .soft-section .text-secondary {
            color: #64748b !important;
        }

        .step-number {
            width: 42px;
            height: 42px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: var(--bim-primary);
            color: #fff;
            font-weight: 800;
        }

        .review-placeholder {
            border: 1px dashed #94a3b8;
            background: rgba(255, 255, 255, .7);
        }

        .footer-link {
            color: rgba(255, 255, 255, .72);
            text-decoration: none;
        }

        .footer-link:hover {
            color: #fff;
        }

        @media (max-width: 991.98px) {
            .hero-section {
                min-height: auto;
                padding: 5rem 0 4rem;
            }

            .navbar-collapse {
                padding-top: 1rem;
            }
        }

        /* Tutoriales - Carrusel */
        .tutoriales-carousel .tutorial-card {
            transition: transform .25s ease, box-shadow .25s ease;
        }

        .tutoriales-carousel .tutorial-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 1rem 2rem rgba(0, 0, 0, .12) !important;
        }

        .tutorial-img-wrapper {
            position: relative;
            aspect-ratio: 16/9;
            overflow: hidden;
            background: #000;
        }

        .tutorial-img-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform .4s ease;
        }

        .tutorial-card:hover .tutorial-img-wrapper img {
            transform: scale(1.06);
        }

        .tutorial-play {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 3.5rem;
            background: rgba(0, 0, 0, .25);
            opacity: .85;
            transition: opacity .25s ease, background .25s ease;
        }

        .tutorial-card:hover .tutorial-play {
            opacity: 1;
            background: rgba(0, 0, 0, .4);
        }

        .tutorial-control {
            width: 3rem;
            opacity: 1;
        }

        .tutorial-arrow {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--bim-primary);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            box-shadow: 0 .5rem 1rem rgba(0, 0, 0, .15);
            transition: background .2s ease;
        }

        .tutorial-arrow:hover {
            background: #0b5ed7;
        }

        .carousel-indicators [data-bs-target] {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 0;
        }
    </style>

    <!-- NAVEGACIÓN PRINCIPAL -->
    <header class="site-header sticky-top border-bottom border-secondary border-opacity-25">
        <nav class="navbar navbar-expand-lg navbar-dark container py-3">
            <a class="navbar-brand d-flex align-items-center gap-2 me-lg-4" href="#inicio" aria-label="BIMNova, inicio">
{{-- <i class="bi bi-buildings-fill fs-2 brand-mark"></i> --}}
<img style="height:38px;" src="{{ asset('images/logo.png') }}"></img>
                <span class="h3 mb-0 fw-bold">BIM<span class="text-primary">Nova</span></span>
            </a>

            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation"
                aria-controls="mainNavigation" aria-expanded="false" aria-label="Abrir menú">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="mainNavigation">
                <ul class="navbar-nav mx-auto align-items-lg-center gap-lg-2">
                    <li class="nav-item"><a class="nav-link text-white fw-semibold px-lg-3"
                            href="#servicios">Servicios</a></li>
                    <li class="nav-item"><a class="nav-link text-white fw-semibold px-lg-3" href="#nosotros">Sobre
                            nosotros</a></li>
                    <li class="nav-item"><a class="nav-link text-white fw-semibold px-lg-3"
                            href="#contacto">Contacto</a></li>
                    <li class="nav-item"><a class="nav-link text-white fw-semibold px-lg-3"
                            href="#tutoriales">Tutoriales</a></li>
                </ul>

                <div
                    class="d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center gap-2 mt-3 mt-lg-0">
                    @auth
                        <a href="{{ url('/dashboard') }}" class="btn btn-outline-light rounded-pill px-4">Mi plataforma</a>
                    @else
                        <a href="{{ route('login') }}"
                            class="btn btn-link text-white text-decoration-none fw-semibold">Iniciar sesión</a>
                        @if (Route::has('register'))
                            <a href="{{ route('register') }}" class="btn btn-primary rounded-pill px-4">Registrarse</a>
                        @endif
                    @endauth
                </div>
            </div>
        </nav>
    </header>

    <main class="flex-grow-1">
        <!-- PORTADA -->
        <section id="inicio" class="hero-section d-flex align-items-center">
            <div class="container">
                <div class="row align-items-center g-5">
                    <div class="col-lg-7" data-aos="fade-up">
                        <span
                            class="badge rounded-pill bg-primary bg-opacity-25 text-info border border-primary border-opacity-25 px-3 py-2 mb-4">
                            BIM · INTELIGENCIA ARTIFICIAL · REALIDAD AUMENTADA
                        </span>
                        <div class="hero-copy">
                            <h1 class="display-3 fw-bolder lh-sm mb-4">
                                Construimos el futuro conectando lo
                                <span class="text-primary">digital y lo físico.</span>
                            </h1>
                            <p class="fs-5 text-light opacity-75 fw-light mb-5">
                                Llevamos la construcción al siguiente nivel conectando el mundo digital y el físico.
                                Gracias a BIM, Inteligencia Artificial y Realidad Aumentada, visualiza el proyecto
                                directamente sobre la obra, supervisa avances en tiempo real y garantiza una ejecución
                                precisa, eficiente y alineada con el diseño original.
                            </p>
                        </div>
                        <div class="d-flex flex-column flex-sm-row gap-3">
                            <a href="#contacto"
                                class="btn btn-primary btn-lg rounded-pill px-5 d-inline-flex align-items-center justify-content-center gap-2 shadow">
                                Solicitar demo <i class="bi bi-arrow-right"></i>
                            </a>
                            <a href="#como-funciona"
                                class="btn btn-outline-light btn-lg rounded-pill px-5 d-inline-flex align-items-center justify-content-center gap-2">
                                Prueba ahora <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                        </div>
                    </div>
                    <div class="col-lg-5" data-aos="fade-left">
                        <div class="hero-image rounded-4 p-2 shadow-lg">
                            <img src="{{ asset('images/portada.png') }}" alt="Visualización de un proyecto BIM en 3D"
                                class="img-fluid rounded-3 w-100" style="max-height: 480px; object-fit: cover;">
                        </div>
                        <div class="d-flex justify-content-center gap-4 mt-4 text-white-50 small">
                            <span><i class="bi bi-boxes text-primary me-1"></i> Modelado BIM</span>
                            <span><i class="bi bi-phone text-primary me-1"></i> Experiencia AR</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- BENEFICIOS / PROPUESTA DE VALOR -->
        <section class="py-5">
            <div class="container py-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">Una nueva forma de construir</span>
                    <h2 class="section-title display-5 text-white mt-2">Tecnología que transforma cada proyecto</h2>
                    <p class="text-light opacity-75 fs-5 mx-auto" style="max-width: 760px;">
                        Integramos información, visualización y gestión para tomar mejores decisiones durante todo el
                        proceso constructivo.
                    </p>
                </div>

                <div class="row g-4">
                    <div class="col-md-6 col-lg-4" data-aos="fade-up">
                        <article class="glass-card service-card rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-cash-coin"></i></div>
                            <h3 class="h4 fw-bold text-white">Optimización de costos y tiempos</h3>
                            <p class="text-light opacity-75 mb-0">La coordinación interdisciplinaria y la detección
                                temprana de conflictos permiten minimizar retrabajos y desperdicios. El resultado:
                                proyectos más ágiles, con una gestión eficiente de recursos y un ahorro significativo en
                                inversión.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="80">
                        <article class="glass-card service-card rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-phone"></i></div>
                            <h3 class="h4 fw-bold text-white">Visualización interactiva en Realidad Aumentada</h3>
                            <p class="text-light opacity-75 mb-0">Los clientes pueden explorar su obra antes de
                                construirla, interactuando con modelos 3D aumentados que facilitan la comprensión del
                                diseño. Esto mejora la comunicación con inversionistas y usuarios finales, generando
                                confianza y claridad.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="160">
                        <article class="glass-card service-card rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-kanban"></i></div>
                            <h3 class="h4 fw-bold text-white">Gestión integral del proyecto</h3>
                            <p class="text-light opacity-75 mb-0">Desde la planificación hasta la ejecución, se ofrece
                                un acompañamiento estratégico que asegura calidad en cada fase. La trazabilidad digital
                                permite monitorear avances y tomar decisiones informadas en tiempo real.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up">
                        <article class="glass-card service-card rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-cpu"></i></div>
                            <h3 class="h4 fw-bold text-white">Innovación tecnológica aplicada</h3>
                            <p class="text-light opacity-75 mb-0">La combinación de modelado digital y realidad
                                aumentada convierte la planificación en una experiencia inmersiva. Esto moderniza la
                                presentación de proyectos y fortalece la competitividad frente a propuestas
                                tradicionales.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="80">
                        <article class="glass-card service-card rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-person-check"></i></div>
                            <h3 class="h4 fw-bold text-white">Soporte estratégico y personalizado</h3>
                            <p class="text-light opacity-75 mb-0">Cada cliente recibe soluciones adaptadas a sus
                                necesidades específicas. El enfoque no es solo técnico, sino también comercial y visual,
                                garantizando que el proyecto sea atractivo, rentable y sostenible.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="160">
                        <article
                            class="glass-card service-card rounded-4 p-4 h-100 d-flex flex-column justify-content-center align-items-start">
                            <div class="feature-icon mb-4"><i class="bi bi-stars"></i></div>
                            <h3 class="h4 fw-bold text-white">Lleva tu proyecto al siguiente nivel</h3>
                            <p class="text-light opacity-75">Conoce cómo BIMNova puede ayudarte a visualizar y
                                gestionar tu obra.</p>
                            <a href="#contacto" class="btn btn-outline-primary rounded-pill px-4">Solicitar asesoría
                                <i class="bi bi-arrow-right ms-1"></i></a>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <!-- SERVICIOS -->
        <section id="servicios" class="soft-section py-5">
            <div class="container py-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">Qué hacemos</span>
                    <h2 class="section-title display-5 mt-2">Nuestros servicios</h2>
                    <p class="text-secondary fs-5 mx-auto" style="max-width: 700px;">Soluciones integrales para
                        planificar, construir, supervisar y presentar proyectos con tecnología.</p>
                </div>
                <div class="row g-4">
                    <div class="col-md-6 col-lg-4" data-aos="fade-up">
                        <article class="card service-card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-layers"></i></div>
                            <h3 class="h4 fw-bold">Asesorías BIM</h3>
                            <p class="text-secondary mb-0">Planificación integral con modelado avanzado, simulaciones
                                4D y control del ciclo de vida del proyecto.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="60">
                        <article class="card service-card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-phone-landscape"></i></div>
                            <h3 class="h4 fw-bold">Aplicación de Realidad Aumentada</h3>
                            <p class="text-secondary mb-0">Visualización interactiva de proyectos antes de construir,
                                presentaciones inmersivas para clientes e inversionistas y reducción de errores en obra.
                            </p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="120">
                        <article class="card service-card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-building"></i></div>
                            <h3 class="h4 fw-bold">Construcciones en general</h3>
                            <p class="text-secondary mb-0">Desarrollo de proyectos residenciales, comerciales e
                                industriales con calidad estructural, sostenibilidad y eficiencia en recursos.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-6" data-aos="fade-up">
                        <article class="card service-card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-clipboard2-check"></i></div>
                            <h3 class="h4 fw-bold">Supervisión y Gestión de Proyectos</h3>
                            <p class="text-secondary mb-0">Coordinación interdisciplinaria, control de calidad conforme
                                a normativas NB/ISO, monitoreo de avances y resolución de problemas en obra. Garantiza
                                eficiencia, cumplimiento y resultados confiables en cada fase.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-6" data-aos="fade-up" data-aos-delay="80">
                        <article class="card service-card border-0 shadow-sm rounded-4 p-4 h-100">
                            <div class="feature-icon mb-4"><i class="bi bi-badge-3d"></i></div>
                            <h3 class="h4 fw-bold">Visualización Inmersiva con RA</h3>
                            <p class="text-secondary mb-0">Experiencias digitales diseñadas para mostrar departamentos
                                y proyectos de manera clara y atractiva. La visualización inmersiva permite transmitir
                                confianza, destacar el diseño y acelerar la decisión de compra, convirtiéndose en una
                                herramienta clave para la venta inmobiliaria.</p>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <!-- CÓMO SE USA LA PLATAFORMA -->
        <section id="como-funciona" class="py-5">
            <div class="container py-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">Empieza en pocos pasos</span>
                    <h2 class="section-title display-5 text-white mt-2">¿Cómo se usa la plataforma?</h2>
                    <p class="text-white-50 fs-5">Una experiencia sencilla para llevar tus modelos digitales al entorno
                        real.</p>
                </div>
                <div class="row g-4">
                    <div class="col-sm-6 col-lg-3" data-aos="fade-up">
                        <article class="glass-card step-card rounded-4 p-4 h-100">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="step-number">1</span><i class="bi bi-eyeglasses fs-1 text-primary"></i>
                            </div>
                            <h3 class="h5 fw-bold text-white">Explora la experiencia AR</h3>
                            <p class="text-white-50 mb-0">Accede a nuestra aplicación y descubre cómo tu proyecto cobra
                                vida en realidad aumentada.</p>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay="60">
                        <article class="glass-card step-card rounded-4 p-4 h-100">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="step-number">2</span><i
                                    class="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                            </div>
                            <h3 class="h5 fw-bold text-white">Carga tu proyecto digital</h3>
                            <p class="text-white-50 mb-0">Sube tus modelos desde cualquier software compatible y
                                visualízalos en segundos.</p>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay="120">
                        <article class="glass-card step-card rounded-4 p-4 h-100">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="step-number">3</span><i
                                    class="bi bi-hand-index-thumb fs-1 text-primary"></i>
                            </div>
                            <h3 class="h5 fw-bold text-white">Interactúa en tiempo real</h3>
                            <p class="text-white-50 mb-0">Recorre tu obra, detecta detalles y ajusta decisiones
                                directamente en el entorno aumentado.</p>
                        </article>
                    </div>
                    <div class="col-sm-6 col-lg-3" data-aos="fade-up" data-aos-delay="180">
                        <article class="glass-card step-card rounded-4 p-4 h-100">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <span class="step-number">4</span><i class="bi bi-people fs-1 text-primary"></i>
                            </div>
                            <h3 class="h5 fw-bold text-white">Comparte y colabora</h3>
                            <p class="text-white-50 mb-0">Invita a clientes e inversionistas a vivir la experiencia,
                                mejorando comunicación y confianza.</p>
                        </article>
                    </div>
                </div>
                <div class="text-center mt-5">
                    @auth
                        <a href="{{ url('/dashboard') }}" class="btn btn-primary btn-lg rounded-pill px-5">Ir a la
                            plataforma <i class="bi bi-arrow-right ms-2"></i></a>
                    @else
                        @if (Route::has('register'))
                            <a href="{{ route('register') }}" class="btn btn-primary btn-lg rounded-pill px-5">Crear una
                                cuenta <i class="bi bi-arrow-right ms-2"></i></a>
                        @else
                            <a href="#contacto" class="btn btn-primary btn-lg rounded-pill px-5">Solicitar información <i
                                    class="bi bi-arrow-right ms-2"></i></a>
                        @endif
                    @endauth
                </div>
            </div>
        </section>

        <!-- SOBRE NOSOTROS -->
        <section id="nosotros" class="soft-section py-5">
            <div class="container py-5">
                <div class="row align-items-center g-5">
                    <div class="col-lg-5" data-aos="fade-right">
                        <div class="position-relative">
                            <img src="{{ asset('images/portada.png') }}" alt="Tecnología BIMNova aplicada a proyectos"
                                class="img-fluid rounded-4 shadow-lg w-100"
                                style="max-height: 560px; object-fit: cover;">
                            <div
                                class="position-absolute bottom-0 start-0 translate-middle-y ms-3 bg-primary text-white rounded-4 p-3 shadow">
                                <i class="bi bi-building-check fs-2"></i>
                                <div class="fw-bold">BIMNova</div>
                                <small>Proyectos Integrales</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-7" data-aos="fade-left">
                        <span class="section-kicker">Quiénes somos</span>
                        <h2 class="section-title display-5 mt-2 mb-4">Sobre nosotros</h2>
                        <p class="fs-5 text-secondary">
                            En BIMNova Proyectos Integrales somos especialistas en BIM Management y tecnologías
                            digitales aplicadas a la construcción. Nuestra misión es transformar la manera en que se
                            planifican y gestionan los proyectos, integrando modelado avanzado, coordinación
                            interdisciplinaria y experiencias interactivas en Realidad Aumentada.
                        </p>
                        <p class="text-secondary mb-4">
                            Nos enfocamos en ofrecer soluciones que combinan innovación, eficiencia y claridad,
                            asegurando que cada cliente pueda visualizar, comprender y decidir con confianza antes de
                            ejecutar su obra.
                        </p>
                        <p class="text-secondary mb-0">
                            Con un enfoque estratégico y tecnológico, convertimos la complejidad de los proyectos en
                            procesos más simples, accesibles y rentables.
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- POR QUÉ ELEGIRNOS -->
        <section class="soft-section pt-0 pb-5">
            <div class="container pb-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">Nuestro compromiso</span>
                    <h2 class="section-title display-5 mt-2">¿Por qué elegirnos?</h2>
                </div>
                <div class="row g-4">
                    <div class="col-md-6 col-lg-4" data-aos="fade-up">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-clock-history fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Ahorro en costos y tiempos</h3>
                            <p class="text-secondary mb-0">Detectamos conflictos antes de la ejecución, optimizamos
                                recursos y reducimos retrabajos, logrando proyectos más ágiles y rentables.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="50">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-mouse fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Facilidad de uso</h3>
                            <p class="text-secondary mb-0">Nuestras soluciones digitales están diseñadas para ser
                                intuitivas y accesibles, permitiendo que cualquier cliente o equipo interactúe con los
                                modelos sin necesidad de conocimientos técnicos avanzados.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-lightbulb fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Innovación tecnológica</h3>
                            <p class="text-secondary mb-0">Aplicamos Realidad Aumentada para visualizar tu obra antes
                                de construirla, mejorando comunicación y confianza con clientes e inversionistas.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-clipboard-data fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Gestión integral y supervisión</h3>
                            <p class="text-secondary mb-0">Ofrecemos coordinación interdisciplinaria, control de
                                calidad y monitoreo constante que aseguran eficiencia y cumplimiento normativo.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="50">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-person-heart fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Enfoque personalizado</h3>
                            <p class="text-secondary mb-0">Cada cliente recibe soluciones adaptadas a sus necesidades,
                                con propuestas claras, creativas y estratégicas.</p>
                        </article>
                    </div>
                    <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
                        <article class="reason-card bg-white rounded-4 shadow-sm p-4 h-100">
                            <i class="bi bi-shield-check fs-2 text-primary mb-3 d-block"></i>
                            <h3 class="h5 fw-bold">Confianza y transparencia</h3>
                            <p class="text-secondary mb-0">Trabajamos con reportes técnicos, comparativas visuales y
                                comunicación constante para que cada paso del proyecto sea seguro y verificable.</p>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <!-- RESEÑAS -->
        <section id="resenas" class="py-5">
            <div class="container py-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">La experiencia de nuestros clientes</span>
                    <h2 class="section-title display-5 text-white mt-2">Confianza construida en equipo</h2>
                    <p class="text-white-50 fs-5 mx-auto" style="max-width: 680px;">
                        Lo que dicen los profesionales de la industria que confían en BIMNova para impulsar y supervisar
                        sus proyectos.
                    </p>
                </div>
                <div class="row g-4">
                    <!-- Reseña 1 -->
                    <div class="col-md-4" data-aos="fade-up">
                        <article
                            class="glass-card service-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <div class="text-warning small">
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill"></i>
                                    </div>
                                    <i class="bi bi-quote fs-1 text-primary opacity-50"></i>
                                </div>
                                <p class="text-light opacity-75 fst-italic mb-4">
                                    "La posibilidad de acceder a los modelos 3D desde un dispositivo móvil simplifica
                                    mucho el trabajo en campo. Es una solución interesante para mejorar la coordinación
                                    entre oficina técnica y personal de obra."
                                </p>
                            </div>
                            <div
                                class="d-flex align-items-center gap-3 pt-3 border-top border-secondary border-opacity-25">
                                <img src="{{ asset('images/reviews/1.png') }}" alt="Ing. Ximena Dias"
                                    class="rounded-circle border border-2 border-primary shadow-sm"
                                    style="width: 54px; height: 54px; object-fit: cover;"
                                    onerror="this.src='https://ui-avatars.com/api/?name=Ximena+Dias&background=0d6efd&color=fff'">
                                <div>
                                    <h3 class="h6 fw-bold text-white mb-0">Ing. Ximena Dias</h3>
                                    <small class="text-primary fw-semibold">Modeladora BIM</small>
                                </div>
                            </div>
                        </article>
                    </div>

                    <!-- Reseña 2 -->
                    <div class="col-md-4" data-aos="fade-up" data-aos-delay="70">
                        <article
                            class="glass-card service-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <div class="text-warning small">
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill"></i>
                                    </div>
                                    <i class="bi bi-quote fs-1 text-primary opacity-50"></i>
                                </div>
                                <p class="text-light opacity-75 fst-italic mb-4">
                                    "La plataforma BIMNOVA nos permite visualizar el avance de nuestros proyectos de una
                                    manera mucho más práctica. La integración de modelos 3D con realidad aumentada
                                    facilita la supervisión y mejora la comunicación en obra."
                                </p>
                            </div>
                            <div
                                class="d-flex align-items-center gap-3 pt-3 border-top border-secondary border-opacity-25">
                                <img src="{{ asset('images/reviews/2.png') }}" alt="Ing. Maura Llanos"
                                    class="rounded-circle border border-2 border-primary shadow-sm"
                                    style="width: 54px; height: 54px; object-fit: cover;"
                                    onerror="this.src='https://ui-avatars.com/api/?name=Maura+Llanos&background=0d6efd&color=fff'">
                                <div>
                                    <h3 class="h6 fw-bold text-white mb-0">Ing. Maura Llanos</h3>
                                    <small class="text-primary fw-semibold">BIM MANAGER</small>
                                </div>
                            </div>
                        </article>
                    </div>

                    <!-- Reseña 3 -->
                    <div class="col-md-4" data-aos="fade-up" data-aos-delay="140">
                        <article
                            class="glass-card service-card rounded-4 p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex align-items-center justify-content-between mb-3">
                                    <div class="text-warning small">
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill me-1"></i>
                                        <i class="bi bi-star-fill"></i>
                                    </div>
                                    <i class="bi bi-quote fs-1 text-primary opacity-50"></i>
                                </div>
                                <p class="text-light opacity-75 fst-italic mb-4">
                                    "Nos parece una herramienta innovadora que permite llevar los modelos BIM
                                    directamente al sitio de construcción. La posibilidad de visualizar el proyecto en
                                    su ubicación real es una gran ventaja."
                                </p>
                            </div>
                            <div
                                class="d-flex align-items-center gap-3 pt-3 border-top border-secondary border-opacity-25">
                                <img src="{{ asset('images/reviews/3.png') }}" alt="Ing. Saul Bermudez"
                                    class="rounded-circle border border-2 border-primary shadow-sm"
                                    style="width: 54px; height: 54px; object-fit: cover;"
                                    onerror="this.src='https://ui-avatars.com/api/?name=Saul+Bermudez&background=0d6efd&color=fff'">
                                <div>
                                    <h3 class="h6 fw-bold text-white mb-0">Ing. Saul Bermudez</h3>
                                    <small class="text-primary fw-semibold">GERENTE AXFER</small>
                                </div>
                            </div>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <!-- TUTORIALES -->
        <section id="tutoriales" class="soft-section py-5">
            <div class="container py-5">
                <div class="text-center mb-5" data-aos="fade-up">
                    <span class="section-kicker">Aprende con BIMNova</span>
                    <h2 class="section-title display-5 mt-2">Tutoriales y formación</h2>
                    <p class="text-secondary fs-5">Recursos para conocer la plataforma y aprovechar las herramientas
                        digitales.</p>
                </div>

                @if ($tutorials->isNotEmpty())
                    @php
                        $chunks = $tutorials->chunk(3);
                    @endphp

                    <div id="tutorialesCarousel" class="carousel slide tutoriales-carousel" data-bs-ride="carousel"
                        data-aos="fade-up">
                        <div class="carousel-inner px-5">

                            @foreach ($chunks as $chunkIndex => $chunk)
                                <div class="carousel-item {{ $chunkIndex === 0 ? 'active' : '' }}">
                                    <div class="row g-4 justify-content-center">
                                        @foreach ($chunk as $tutorial)
                                            <div class="col-md-6 col-lg-4">
                                                <article
                                                    class="card tutorial-card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                                                    <div class="tutorial-img-wrapper">
                                                        <img src="{{ $tutorial->thumbnail_url }}"
                                                            alt="{{ $tutorial->title }}" class="w-100">
                                                        <span class="tutorial-play">
                                                            <i class="bi bi-play-circle-fill"></i>
                                                        </span>
                                                    </div>
                                                    <div class="card-body p-4 d-flex flex-column">
                                                        <h3 class="h5 fw-bold">{{ $tutorial->title }}</h3>
                                                        <p class="text-secondary flex-grow-1">
                                                            {{ $tutorial->description }}</p>
                                                        <a href="{{ $tutorial->youtube_url }}" target="_blank"
                                                            rel="noopener"
                                                            class="btn btn-danger rounded-pill align-self-start px-4">
                                                            <i class="bi bi-youtube me-2"></i>Ver video
                                                        </a>
                                                    </div>
                                                </article>
                                            </div>
                                        @endforeach
                                    </div>
                                </div>
                            @endforeach

                        </div>

                        <!-- Controles (solo si hay más de 1 slide) -->
                        @if ($chunks->count() > 1)
                            <button class="carousel-control-prev tutorial-control" type="button"
                                data-bs-target="#tutorialesCarousel" data-bs-slide="prev">
                                <span class="tutorial-arrow"><i class="bi bi-chevron-left"></i></span>
                                <span class="visually-hidden">Anterior</span>
                            </button>
                            <button class="carousel-control-next tutorial-control" type="button"
                                data-bs-target="#tutorialesCarousel" data-bs-slide="next">
                                <span class="tutorial-arrow"><i class="bi bi-chevron-right"></i></span>
                                <span class="visually-hidden">Siguiente</span>
                            </button>
                        @endif

                        <!-- Indicadores dinámicos -->
                        @if ($chunks->count() > 1)
                            <div class="carousel-indicators position-static mt-4">
                                @foreach ($chunks as $i => $chunk)
                                    <button type="button" data-bs-target="#tutorialesCarousel"
                                        data-bs-slide-to="{{ $i }}"
                                        class="{{ $i === 0 ? 'active' : '' }} bg-primary"
                                        aria-current="{{ $i === 0 ? 'true' : 'false' }}"
                                        aria-label="Slide {{ $i + 1 }}">
                                    </button>
                                @endforeach
                            </div>
                        @endif
                    </div>
                @else
                    <!-- Estado vacío -->
                    <div class="text-center py-5" data-aos="fade-up">
                        <i class="bi bi-collection-play fs-1 text-primary mb-3 d-block"></i>
                        <h3 class="h5 fw-bold">Próximamente</h3>
                        <p class="text-secondary">Estamos preparando los tutoriales. ¡Vuelve pronto!</p>
                    </div>
                @endif
            </div>
        </section>
    </main>

    <!-- MODAL DE CONTACTO -->
    <div class="modal fade" id="contactModal" tabindex="-1" aria-labelledby="contactModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div
                class="modal-content glass-card border border-secondary border-opacity-25 text-white rounded-4 shadow-lg">

                <!-- Encabezado del Modal -->
                <div class="modal-header border-bottom border-secondary border-opacity-25 p-4">
                    <div class="d-flex align-items-center gap-3">
                        <div class="feature-icon" style="width: 44px; height: 44px; font-size: 1.2rem;">
                            <i class="bi bi-envelope-paper-fill"></i>
                        </div>
                        <div>
                            <h2 class="modal-title h5 fw-bold mb-0 text-white" id="contactModalLabel">Hablemos de tu
                                proyecto</h2>
                            <small class="text-white-50">Completa tus datos y nos pondremos en contacto.</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"
                        aria-label="Cerrar"></button>
                </div>

                <!-- Formulario -->
                <form id="contactForm">
                    @csrf
                    <div class="modal-body p-4">

                        <!-- Campo Nombre -->
                        <div class="mb-3">
                            <label for="contact_name" class="form-label text-light small fw-semibold">Nombre completo
                                <span class="text-primary">*</span></label>
                            <div class="input-group">
                                <span
                                    class="input-group-text bg-dark border-secondary border-opacity-25 text-white-50">
                                    <i class="bi bi-person"></i>
                                </span>
                                <input type="text"
                                    class="form-control bg-dark text-white border-secondary border-opacity-25"
                                    id="contact_name" name="name" placeholder="Ej. Juan Pérez" required>
                            </div>
                        </div>

                        <!-- Campos Correo y Teléfono en 2 columnas -->
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label for="contact_email" class="form-label text-light small fw-semibold">Correo
                                    electrónico <span class="text-primary">*</span></label>
                                <div class="input-group">
                                    <span
                                        class="input-group-text bg-dark border-secondary border-opacity-25 text-white-50">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input type="email"
                                        class="form-control bg-dark text-white border-secondary border-opacity-25"
                                        id="contact_email" name="email" placeholder="nombre@empresa.com" required>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <label for="contact_phone" class="form-label text-light small fw-semibold">Teléfono /
                                    WhatsApp <span class="text-primary">*</span></label>
                                <div class="input-group">
                                    <span
                                        class="input-group-text bg-dark border-secondary border-opacity-25 text-white-50">
                                        <i class="bi bi-telephone"></i>
                                    </span>
                                    <input type="tel"
                                        class="form-control bg-dark text-white border-secondary border-opacity-25"
                                        id="contact_phone" name="phone" placeholder="+591 70000000" required>
                                </div>
                            </div>
                        </div>

                        <!-- Campo Mensaje -->
                        <div class="mb-3">
                            <label for="contact_message" class="form-label text-light small fw-semibold">Mensaje <span
                                    class="text-primary">*</span></label>
                            <textarea class="form-control bg-dark text-white border-secondary border-opacity-25" id="contact_message"
                                name="message" rows="4" placeholder="Cuéntanos sobre tu proyecto o consulta..." required></textarea>
                        </div>

                    </div>

                    <!-- Footer del Modal -->
                    <div
                        class="modal-footer border-top border-secondary border-opacity-25 p-4 d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-light rounded-pill px-4"
                            data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary rounded-pill px-4">
                            <i class="bi bi-send-fill me-2"></i>Preparar correo
                        </button>
                    </div>
                </form>

            </div>
        </div>
    </div>

    <!-- CONTACTO / PIE DE PÁGINA -->
    <footer id="contacto" class="bg-black text-white pt-5 pb-4 border-top border-primary border-opacity-25">
        <div class="container">
            <div class="row gy-4 mb-5">
                <div class="col-lg-5">
                    <a href="#inicio" class="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
                        <i class="bi bi-buildings-fill fs-2 text-primary"></i>
                        <span class="h3 fw-bold mb-0 text-white">BIM<span class="text-primary">Nova</span></span>
                    </a>
                    <p class="text-white-50 mb-0">
                        BIMNova Proyectos Integrales. Innovación, modelado digital y Realidad Aumentada para una
                        construcción más clara, eficiente y conectada.
                    </p>
                </div>
                <div class="col-sm-6 col-lg-3">
                    <h2 class="h5 fw-bold mb-3">Navegación</h2>
                    <ul class="list-unstyled d-flex flex-column gap-2 mb-0">
                        <li><a class="footer-link" href="#servicios">Servicios</a></li>
                        <li><a class="footer-link" href="#nosotros">Sobre nosotros</a></li>
                        <li><a class="footer-link" href="#tutoriales">Tutoriales</a></li>
                        <li><a class="footer-link" href="#resenas">Reseñas</a></li>
                    </ul>
                </div>
                <div class="col-sm-6 col-lg-4">
                    <h2 class="h5 fw-bold mb-3">Hablemos de tu proyecto</h2>
                    <p class="text-white-50">Solicita una demostración o consulta por nuestros servicios y cursos.</p>

                    <!-- Botón que abre el Modal -->
                    <button type="button" class="btn btn-primary rounded-pill px-4" data-bs-toggle="modal"
                        data-bs-target="#contactModal">
                        <i class="bi bi-envelope me-2"></i>Solicitar información
                    </button>
                </div>
            </div>
            <div
                class="border-top border-secondary border-opacity-25 pt-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
                <p class="text-white-50 small mb-0">© {{ date('Y') }} <strong>BIMNova Proyectos
                        Integrales</strong>. Todos los derechos reservados.</p>
                <a href="#inicio" class="footer-link small">Volver al inicio <i class="bi bi-arrow-up ms-1"></i></a>
            </div>
        </div>
    </footer>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script>
        AOS.init({
            duration: 800,
            once: true,
            offset: 80,
        });
    </script>
    <script>
        document.getElementById('contactForm').addEventListener('submit', function(event) {
            event.preventDefault();

            // Cambia el correo de respaldo por el correo real de BIMNova.
            const destinatario = @json(config('mail.from.address') ?: 'contacto@bimnova.com');

            const datos = new FormData(this);

            const nombre = (datos.get('name') || '').trim();
            const correo = (datos.get('email') || '').trim();
            const telefono = (datos.get('phone') || '').trim();
            const mensaje = (datos.get('message') || '').trim();

            const asunto = `Solicitud de información BIMNova - ${nombre}`;

            const cuerpo = [
                'Solicitud de información desde el sitio web BIMNova',
                '',
                `Nombre: ${nombre}`,
                `Correo: ${correo}`,
                `Teléfono: ${telefono}`,
                '',
                'Mensaje:',
                mensaje
            ].join('\n');

            const mailto = `mailto:${destinatario}` +
                `?subject=${encodeURIComponent(asunto)}` +
                `&body=${encodeURIComponent(cuerpo)}`;

            window.location.href = mailto;
        });
    </script>
</body>

</html>
