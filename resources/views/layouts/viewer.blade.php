<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Viewer UI - Modern Dark</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    @vite(['resources/sass/app.scss', 'resources/js/app.js'])
    <style>
        :root {
            --bg-main: #0f1117;
            --bg-panel: #181a20;
            --bg-soft: #1f222a;
            --accent: #4f8cff;
            --text: #e6e6e6;
            --text-muted: #9aa0a6;
        }

        body {
            overflow: hidden;
            background: var(--bg-main);
            color: var(--text);
            font-family: "Inter", sans-serif;
        }

        .navbar {
            background: rgba(15, 17, 23, 0.8) !important;
            backdrop-filter: blur(10px);
            border-bottom: 1px solid #222;
        }

        .viewport {
            background: radial-gradient(circle at center, #1a1d25, #0f1117);
            height: calc(100vh - 56px);
            position: relative;
        }

        .sidebar,
        .right-panel {
            height: calc(100vh - 56px);
            overflow-y: auto;
            background: var(--bg-panel);
            border-right: 1px solid #222;
        }

        .right-panel {
            border-left: 1px solid #222;
            border-right: none;
        }

        .panel-title {
            font-size: 13px;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 10px;
            letter-spacing: 1px;
        }

        .layer-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            border-radius: 6px;
            transition: 0.2s;
            cursor: pointer;
        }

        .layer-item:hover {
            background: var(--bg-soft);
        }

        .toolbar {
            position: absolute;
            top: 15px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(20, 22, 30, 0.7);
            backdrop-filter: blur(12px);
            padding: 8px 12px;
            border-radius: 14px;
            display: flex;
            gap: 10px;
            border: 1px solid #2a2d36;
        }

        .tool-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: transparent;
            border: none;
            color: var(--text-muted);
            transition: 0.2s;
        }

        .tool-btn:hover {
            background: var(--bg-soft);
            color: var(--text);
        }

        .tool-btn.active {
            background: var(--accent);
            color: white;
        }

        .bottom-bar {
            position: absolute;
            bottom: 0;
            width: 100%;
            background: rgba(15, 17, 23, 0.7);
            backdrop-filter: blur(8px);
            color: var(--text-muted);
            padding: 6px 12px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #222;
        }

        .property {
            background: var(--bg-soft);
            padding: 8px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 13px;
        }

        input.form-control {
            background: var(--bg-soft);
            border: none;
            color: white;
        }

        input.form-control:focus {
            box-shadow: none;
            border: 1px solid var(--accent);
        }


        .loading-splash {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle, #0f1117, #05070c);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            transition: opacity 0.4s ease, visibility 0.4s;
        }

        .loading-splash.hidden {
            opacity: 0;
            visibility: hidden;
        }

        .loading-content {
            text-align: center;
            color: #e6e6e6;
        }

        .loading-content p {
            color: #9aa0a6;
            font-size: 14px;
            letter-spacing: 1px;
        }

        .layer-item span {
            display: flex;
            align-items: center;
            gap: 6px;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            max-width: 140px;
            /* ajusta según tu sidebar */
        }

        .tree-group {
            margin-bottom: 6px;
        }

        .tree-header {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            padding: 6px 8px;
            border-radius: 6px;
            color: #e6e6e6;
            transition: 0.2s;
        }

        .tree-header:hover {
            background: #1f222a;
        }

        .tree-children {
            margin-left: 16px;
            margin-top: 4px;
        }

        .tree-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px;
            border-radius: 6px;
            font-size: 13px;
        }

        .tree-item:hover {
            background: #1f222a;
        }

        .tree-label {
            display: flex;
            align-items: center;
            gap: 6px;

            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tree-toggle {
            width: 16px;
            text-align: center;
            transition: 0.2s;
        }

        .tree-group.collapsed .tree-children {
            display: none;
        }

        .tree-group.collapsed .tree-toggle {
            transform: rotate(-90deg);
        }


        .app-layout {
            height: calc(100vh - 56px);
            display: flex;
            overflow: hidden;
        }

        /* SIDEBARS */
        .sidebar {
            width: 260px;
            min-width: 180px;
            max-width: 400px;
            background: #181a20;
            transition: width 0.25s ease;
            overflow-x: hidden;
            /* overflow: hidden; */
        }

        *::-webkit-scrollbar {
            width: 6px;
        }

        *::-webkit-scrollbar-thumb {
            background: #2a2d36;
            border-radius: 10px;
        }

        *::-webkit-scrollbar-thumb:hover {
            background: #4f8cff;
        }

        /* COLAPSADO */
        .sidebar.collapsed {
            width: 0;
            padding: 0 !important;
        }

        /* VIEWER */
        .viewer-container {
            flex: 1;
            position: relative;
        }

        /* TABS */
        .sidebar-tab {
            width: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1f222a;
            cursor: pointer;
            color: #9aa0a6;
            transition: 0.2s;
        }

        .sidebar-tab:hover {
            background: #4f8cff;
            color: white;
        }

        /* orden lado derecho */
        .right-tab {
            order: 2;
        }

        #rightSidebar {
            order: 3;
        }

        .sidebar.collapsed {
            width: 0;
            min-width: 0;
            padding: 0 !important;
            overflow: hidden;
        }

        .viewer-container {
            flex: 1;
            min-width: 0;
            /* 🔥 CLAVE en flex */
        }



        .app-splash {
            position: fixed;
            inset: 0;
            background: radial-gradient(circle, #0f1117, #05070c);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease, visibility 0.5s ease;
        }

        .app-splash.hidden {
            opacity: 0;
            visibility: hidden;
        }

        .splash-content {
            text-align: center;
            color: #e6e6e6;
        }

        .tree-group {
            border-radius: 10px;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .tree-group:hover {
            transform: translateY(-1px);
        }

        .tree-header {
            font-size: 14px;
        }

        .tree-header input {
            cursor: pointer;
        }

        .tree-header .badge {
            font-size: 11px;
        }

        .visibility-toggle {
            accent-color: #0d6efd;
            /* bootstrap primary */
        }

        .isolate-toggle {
            accent-color: #dc3545;
            /* rojo para aislar */
        }

        .tree-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .tree-header>div {
            min-width: 0;
            /* 🔥 CLAVE para que funcione ellipsis */
        }

        .text-truncate {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .form-check-input {
            margin: 0;
            vertical-align: middle;
        }

        bim-panel,
        .options-menu {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 9999;
            /* 🔥 importante */
            width: 300px;
        }

        .panel-title {
            font-size: 0.85rem;
            text-transform: uppercase;
            font-weight: 600;
            color: #9ca3af;
            margin-bottom: 8px;
        }

        #levels-container {
            max-height: 250px;
            overflow-y: auto;
        }

        #levels-container .card {
            background: #1f222a;
            border: none;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        #levels-container .card:hover {
            background: #0D6EFD;
        }

        #levels-container input {
            cursor: pointer;
        }

        .bottom-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            /* 🔥 CLAVE */
            background: #1a1d25;
            border-top: 1px solid #333;

            display: flex;
            /* 🔥 usamos flex */
            flex-direction: column;
            /* 🔥 pero en vertical */

            transition: height 0.3s ease;
            overflow: hidden;
            z-index: 10;
        }

        .bottom-bar.collapsed {
            height: 40px;
        }

        .bottom-bar.expanded {
            height: 250px;
        }

        .bottom-header {
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 12px;
            cursor: pointer;
        }

        .bottom-content {
            padding: 10px;
            overflow-y: auto;
            height: calc(100% - 40px);
        }

        .marker {
            font-size: 18px;
            cursor: pointer;
            transition: 0.2s;
        }

        .marker:hover {
            transform: scale(1.3);
        }

        .marker.anchor {
            color: #0d6efd;
        }

        .marker.issue {
            color: #dc3545;
        }

        .model-card {
            background: #1f222a;
            border-radius: 12px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .model-card:hover {
            background: #2a2e38;
            border-color: #0d6efd;
            transform: translateY(-3px);
        }

        .model-icon {
            font-size: 40px;
            color: #0d6efd;
            transition: 0.2s;
        }

        .model-card:hover .model-icon {
            transform: scale(1.1);
        }

        .model-card button {
            opacity: 0.9;
        }

        .model-card:hover button {
            opacity: 1;
        }

        .view-card {
            background: #1f222a;
            border-radius: 10px;
            padding: 15px;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s ease;
            font-size: 20px;
            user-select: none;
        }

        .view-card div {
            font-size: 12px;
            margin-top: 5px;
            opacity: 0.8;
        }

        .view-card:hover {
            background: #2a2e38;
            border-color: #0d6efd;
            transform: translateY(-2px);
        }

        .view-card.fit {
            font-size: 14px;
            padding: 10px;
            background: #0d6efd;
        }

        .view-card.fit:hover {
            background: #0b5ed7;
        }


        </style>
    </head>
    <body>
        {{ $slot }}
    </body>
</html>
