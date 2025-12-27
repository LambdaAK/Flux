import { Command } from '../types';
import { ping } from './ping';
import { help } from './help';
import { play } from './play';
import { skip } from './skip';
import { join } from './join';
import { leave } from './leave';
import { queue } from './queue';
import { pause } from './pause';
import { resume } from './resume';
import { stop } from './stop';

/**
 * Command Registry
 * 
 * All commands are exported from here and automatically registered.
 * To add a new command:
 * 1. Create a new file in the commands directory
 * 2. Export a Command object with 'data' and 'execute' properties
 * 3. Import and add it to this object
 */
export const commands: Record<string, Command> = {
  ping,
  help,
  play,
  skip,
  join,
  leave,
  queue,
  pause,
  resume,
  stop,
};

