
/* IMPORT */

import * as _ from 'lodash';
import {ipcMain as ipc, BrowserWindow, Menu, MenuItemConstructorOptions, shell, globalShortcut} from 'electron';
import * as is from 'electron-is';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import pkg from '@root/package.json';
import UMenu from '@main/utils/menu';
import About from './about';
import Route from './route';
import Settings from '@common/settings';

/* MAIN */

class Main extends Route {

  /* VARIABLES */

  _prevFlags: StateFlags | false = false;

  /* CONSTRUCTOR */

  constructor ( name = 'main', options = { minWidth: 685, minHeight: 425 }, stateOptions = { defaultWidth: 850, defaultHeight: 525 } ) {

    super ( name, options, stateOptions );

  }

  /* SPECIAL */

  initLocalShortcuts () {}

  initMenu ( flags: StateFlags | false = this._prevFlags ) {

    this._prevFlags = flags; // Storing them because they are needed also when focusing to the window

    const template: MenuItemConstructorOptions[] = UMenu.filterTemplate ([
      {
        label: pkg.productName,
        submenu: [
          {
            label: `About ${pkg.productName}`,
            click: () => new About ()
          },
          {
            type: 'separator'
          },
          {
            label: 'Import...',
            click: () => this.win.webContents.send ( 'import' )
          },
          {
            label: 'Export',
            enabled: flags && ( flags.hasNote || flags.isMultiEditorEditing ),
            submenu: [
              {
                label: 'HTML',
                click: () => this.win.webContents.send ( 'export-html' )
              },
              {
                label: 'Markdown',
                click: () => this.win.webContents.send ( 'export-markdown' )
              },
              {
                label: 'PDF',
                click: () => this.win.webContents.send ( 'export-pdf' )
              }
            ]
          },
          {
            type: 'separator'
          },
          {
            label: 'Open Data Directory',
            click: () => this.win.webContents.send ( 'cwd-open-in-app' )
          },
          {
            label: 'Change Data Directory...',
            click: () => this.win.webContents.send ( 'cwd-change' )
          },
          {
            type: 'separator'
          },
          {
            role: 'services',
            submenu: [] ,
            visible: is.macOS ()
          },
          {
            type: 'separator',
            visible: is.macOS ()
          },
          {
            role: 'hide',
            visible: is.macOS ()
          },
          {
            role: 'hideothers',
            visible: is.macOS ()
          },
          {
            role: 'unhide',
            visible: is.macOS ()
          },
          {
            type: 'separator',
            visible: is.macOS ()
          },
          { role: 'quit' }
        ]
      },
      {
        label: 'Note',
        submenu: [
          {
            label: 'New',
            accelerator: 'CmdOrCtrl+N',
            enabled: flags && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-new' )
          },
          {
            label: 'New from Template',
            accelerator: 'CmdOrCtrl+Alt+Shift+N',
            enabled: flags && flags.hasNote && flags.isNoteTemplate && !flags.isMultiEditorEditing,
            visible: flags && flags.hasNote && flags.isNoteTemplate,
            click: () => this.win.webContents.send ( 'note-duplicate-template' )
          },
          {
            label: 'Duplicate',
            accelerator: 'CmdOrCtrl+Shift+N',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-duplicate' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Open in Default App',
            accelerator: 'CmdOrCtrl+O',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-open-in-app' )
          },
          {
            label: `Reveal in ${is.macOS () ? 'Finder' : 'Folder'}`,
            accelerator: 'CmdOrCtrl+Alt+R',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-reveal' )
          },
          {
            type: 'separator'
          },
          {
            label: flags && flags.hasNote && flags.isEditorEditing ? 'Stop Editing' : 'Edit',
            accelerator: 'CmdOrCtrl+E',
            enabled: flags && flags.hasNote && !flags.isEditorSplitView && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-toggle' )
          },
          {
            label: flags && flags.hasNote && flags.isTagsEditing ? 'Stop Editing Tags' : 'Edit Tags',
            accelerator: 'CmdOrCtrl+Shift+T',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-tags-toggle' )
          },
          {
            label: flags && flags.hasNote && flags.isAttachmentsEditing ? 'Stop Editing Attachments' : 'Edit Attachments',
            accelerator: 'CmdOrCtrl+Shift+A',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-edit-attachments-toggle' )
          },
          {
            type: 'separator'
          },
          {
            label: flags && flags.hasNote && flags.isNoteFavorited ? 'Unfavorite' : 'Favorite',
            accelerator: 'CmdOrCtrl+D',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-favorite-toggle' )
          },
          {
            label: flags && flags.hasNote && flags.isNotePinned ? 'Unpin' : 'Pin',
            accelerator: 'CmdOrCtrl+P',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            click: () => this.win.webContents.send ( 'note-pin-toggle' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Move to Trash',
            accelerator: 'CmdOrCtrl+Backspace',
            enabled: flags && flags.hasNote && !flags.isNoteDeleted && !flags.isMultiEditorEditing,
            visible: flags && flags.hasNote && !flags.isNoteDeleted && !flags.isEditorEditing,
            click: () => this.win.webContents.send ( 'note-move-to-trash' )
          },
          {
            label: 'Move to Trash',
            accelerator: 'CmdOrCtrl+Alt+Backspace',
            enabled: flags && flags.hasNote && !flags.isNoteDeleted && !flags.isMultiEditorEditing,
            visible: flags && flags.hasNote && !flags.isNoteDeleted && flags.isEditorEditing,
            click: () => this.win.webContents.send ( 'note-move-to-trash' )
          },
          {
            label: 'Restore',
            accelerator: 'CmdOrCtrl+Shift+Backspace',
            enabled: flags && flags.hasNote && flags.isNoteDeleted && !flags.isMultiEditorEditing,
            visible: flags && flags.hasNote && flags.isNoteDeleted,
            click: () => this.win.webContents.send ( 'note-restore' )
          },
          {
            label: 'Permanently Delete',
            accelerator: 'CmdOrCtrl+Alt+Shift+Backspace',
            enabled: flags && flags.hasNote && !flags.isMultiEditorEditing,
            visible: flags && flags.hasNote,
            click: () => this.win.webContents.send ( 'note-permanently-delete' )
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' },
          {
            type: 'separator'
          },
          {
            label: 'Select Notes - All',
            accelerator: 'CmdOrCtrl+Alt+A',
            click: () => this.win.webContents.send ( 'multi-editor-select-all' )
          },
          {
            label: 'Select Notes - Invert',
            accelerator: 'CmdOrCtrl+Alt+I',
            click: () => this.win.webContents.send ( 'multi-editor-select-invert' )
          },
          {
            label: 'Select Notes - Clear',
            accelerator: 'CmdOrCtrl+Alt+C',
            click: () => this.win.webContents.send ( 'multi-editor-select-clear' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Empty Trash',
            click: () => this.win.webContents.send ( 'trash-empty' )
          },
          {
            type: 'separator',
            visible: is.macOS ()
          },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ],
            visible: is.macOS ()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'resetzoom' },
          { role: 'zoomin' },
          { role: 'zoomout' },
          { type: 'separator' },
          {
            label: 'Toggle Focus Mode',
            accelerator: 'CmdOrCtrl+Alt+F',
            click: () => this.win.webContents.send ( 'window-focus-toggle' )
          },
          {
            label: 'Toggle Split View Mode',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => this.win.webContents.send ( 'editor-split-toggle' )
          },
          { role: 'togglefullscreen' }
        ]
      },
      {
        role: 'window',
        submenu: [
          { role: 'close' },
          { role: 'minimize' },
          {
            role: 'zoom',
            visible: is.macOS ()
          },
          {
            type: 'separator'
          },
          {
            label: 'Search',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.win.webContents.send ( 'search-focus' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Previous Tag',
            accelerator: 'Control+Alt+Shift+Tab',
            click: () => this.win.webContents.send ( 'tag-previous' )
          },
          {
            label: 'Next Tag',
            accelerator: 'Control+Alt+Tab',
            click: () => this.win.webContents.send ( 'tag-next' )
          },
          {
            type: 'separator'
          },
          {
            label: 'Previous Note',
            accelerator: 'Control+Shift+Tab',
            click: () => this.win.webContents.send ( 'search-previous' )
          },
          {
            label: 'Next Note',
            accelerator: 'Control+Tab',
            click: () => this.win.webContents.send ( 'search-next' )
          },
          { type: 'separator' },
          {
            type: 'checkbox',
            label: 'Float on Top',
            checked: !!this.win && this.win.isAlwaysOnTop (),
            click: () => this.win.setAlwaysOnTop ( !this.win.isAlwaysOnTop () )
          },
          {
            type: 'separator',
            visible: is.macOS ()
          },
          {
            role: 'front',
            visible: is.macOS ()
          }
        ]
      },
      {
        role: 'help',
        submenu: [
          {
            label: 'Learn More',
            click: () => shell.openExternal ( pkg.homepage )
          },
          {
            label: 'Tutorial',
            click: () => this.win.webContents.send ( 'tutorial-dialog' )
          },
          {
            label: 'Support',
            click: () => shell.openExternal ( pkg.bugs.url )
          },
          { type: 'separator' },
          {
            label: 'View Changelog',
            click: () => shell.openExternal ( `${pkg.homepage}/blob/master/CHANGELOG.md` )
          },
          {
            label: 'View License',
            click: () => shell.openExternal ( `${pkg.homepage}/blob/master/LICENSE` )
          },
          { type: 'separator' },
          {
            role: 'toggledevtools'
          }
        ]
      }
    ]);

    const menu = Menu.buildFromTemplate ( template );

    Menu.setApplicationMenu ( menu );

  }

  events () {

    super.events ();

    this.___fullscreenEnter ();
    this.___fullscreenLeave ();
    this.___flagsUpdate ();
    this.___navigateUrl ();
    this.___printPDF ();

  }

  /* FULLSCREEN ENTER */

  ___fullscreenEnter () {

    this.win.on ( 'enter-full-screen', this.__fullscreenEnter.bind ( this ) );

  }

  __fullscreenEnter () {

    this.win.webContents.send ( 'window-fullscreen-set', true );

  }

  /* FULLSCREEN LEAVE */

  ___fullscreenLeave () {

    this.win.on ( 'leave-full-screen', this.__fullscreenLeave.bind ( this ) );

  }

  __fullscreenLeave () {

    this.win.webContents.send ( 'window-fullscreen-set', false );

  }

  /* FLAGS UPDATE */

  ___flagsUpdate () {

    ipc.on ( 'flags-update', this.__flagsUpdate.bind ( this ) );

  }

  __flagsUpdate ( event, flags ) {

    this.initMenu ( flags );

  }

  /* NAVIGATE URL */

  ___navigateUrl () {

    this.win.webContents.on ( 'new-window', this.__navigateUrl.bind ( this ) );

  }

  __navigateUrl ( event, url ) {

    if ( url === this.win.webContents.getURL () ) return;

    event.preventDefault ();

    shell.openExternal ( url );

  }

  /* PRINT PDF */

  ___printPDF () {

    ipc.on ( 'print-pdf', this.__printPDF.bind ( this ) );

  }

  __printPDF ( event, options ) {

    const win = new BrowserWindow ({
      show: false,
      webPreferences: {
        webSecurity: false
      }
    });

    if ( options.html ) {

      win.loadURL ( `data:text/html;charset=utf-8,${options.html}` );

    } else if ( options.src ) {

      win.loadFile ( options.src );

    } else {

      return console.error ( 'No content or file to print to PDF provided' );

    }

    win.webContents.on ( 'did-finish-load', () => {
      win.webContents.printToPDF ( {}, ( err, data ) => {
        if ( err ) return console.error ( err );
        fs.writeFile ( options.dst, data, err => {
          if ( err ) {
            if ( err.code === 'ENOENT' ) {
              mkdirp ( path.dirname ( options.dst ), err => {
                if ( err ) return console.error ( err );
                fs.writeFile ( options.dst, data, err => {
                  if ( err ) return console.error ( err );
                });
              });
            } else {
              return console.error ( err );
            }
          }
        });
      });
    });

  }

  /* Global Shortcut */

  __registerGlobalToggleShortcut () {

    const accelerator = Settings.get ( 'keybindings.globalToggleWindow' );

    if ( accelerator ) {

      globalShortcut.register( accelerator, () => {

        if ( this.win.isVisible () && this.win.isFocused () ) this.win.hide ();

        else {

          if ( this.win.isMinimized () ) this.win.restore ();

          this.win.show ();

        }

      });

    }

  }

  /* LOAD */

  load () {

    super.load ();

    setTimeout ( this.__didFinishLoad.bind ( this ), 500 ); //TODO: Ideally the timeout should be 0, for for that we need to minimize the amount of work happening before the skeleton can be rendered

    this.__registerGlobalToggleShortcut ();

  }

}

/* EXPORT */

export default Main;
