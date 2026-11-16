import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import { relay } from "../relay/session";

interface Props {
  label: string;
  onCheck(): void;
  onSubmit(): void;
}

// ANSI colors picked to read on the dark screen in both themes: the prompt is
// bold green and bold blue, ls colors directories blue and programs green.
const PALETTE = {
  black: "#0b100e",
  red: "#f0896f",
  green: "#a4d6a8",
  yellow: "#f0b45c",
  blue: "#8fc1e8",
  magenta: "#d9a7df",
  cyan: "#8fd3cc",
  white: "#d8e5da",
  brightBlack: "#7d9086",
  brightRed: "#ffa48d",
  brightGreen: "#bfe8c2",
  brightYellow: "#f7cd84",
  brightBlue: "#b3d7f3",
  brightMagenta: "#ebc3ef",
  brightCyan: "#b0e6e0",
  brightWhite: "#f4f8f4",
};

// The player's shell in the relay machine. Keystrokes go straight to it, and
// Ctrl/Cmd+Enter checks the mission, as Run does in the code editor.
export function RelayTerminal({ label, onCheck, onSubmit }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const keys = useRef({ onCheck, onSubmit });
  keys.current = { onCheck, onSubmit };

  useEffect(() => {
    const element = host.current!;
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    const terminal = new Terminal({
      fontFamily: token("--mono"),
      fontSize: 14,
      lineHeight: 1.15,
      cursorBlink: true,
      scrollback: 3000,
      theme: {
        ...PALETTE,
        background: token("--screen"),
        foreground: token("--screen-ink"),
        cursor: token("--signal"),
        cursorAccent: token("--screen"),
        selectionBackground: token("--screen-selection"),
      },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(element);
    terminal.textarea?.setAttribute("aria-label", label);
    terminal.attachCustomKeyEventHandler((event) => {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return true;
      if (event.type === "keydown") {
        event.preventDefault();
        (event.shiftKey ? keys.current.onSubmit : keys.current.onCheck)();
      }
      return false;
    });

    const fitNow = () => {
      if (!element.clientWidth || !element.clientHeight) return;
      fit.fit();
      relay.resize(terminal.cols, terminal.rows);
    };
    const observer = new ResizeObserver(fitNow);
    observer.observe(element);
    fitNow();

    const typing = terminal.onData((data) => relay.type(data));
    const stops = [
      relay.onOutput((bytes) => terminal.write(bytes)),
      relay.onClear(() => terminal.reset()),
      relay.show(),
    ];
    return () => {
      observer.disconnect();
      typing.dispose();
      for (const stop of stops) stop();
      terminal.dispose();
    };
    // One terminal per mount; the label only matters when it's created.
  }, []);

  return <div className="relay-terminal-screen" ref={host} />;
}
