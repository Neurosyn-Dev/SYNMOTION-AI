/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SceneCommand {
  name: string;
  execute: () => void;
  undo: () => void;
}

export class CommandManager {
  private undoStack: SceneCommand[] = [];
  private redoStack: SceneCommand[] = [];
  private maxHistory = 50;
  private listeners: (() => void)[] = [];

  public execute(command: SceneCommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
    this.notify();
  }

  public undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;
    cmd.undo();
    this.redoStack.push(cmd);
    this.notify();
    return true;
  }

  public redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;
    cmd.execute();
    this.undoStack.push(cmd);
    this.notify();
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public getUndoName(): string | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].name : null;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const globalCommandManager = new CommandManager();
