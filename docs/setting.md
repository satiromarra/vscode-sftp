# Setting

There are a handful of settings available for SFTP, and they can be changed:

- On Windows/Linux: File --> Preferences --> Settings
- On macOS: Code --> Preferences --> Settings

## debug
*boolean*: Adds debugging output to the SFTP output panel.
You can view the login in `View --> Output --> SFTP`.  Changing this requires VSCode to be reloaded.

**default**: false

## downloadWhenOpenInRemoteExplorer
*boolean*: Change the default behavior from `View Content` to `Edit in Local` when opening files in the Remote Explorer.

**default**: false

## skipFolderSelectionWhenSingleFolder
*boolean*: Prevents showing 'Select a folder...' when the number of candidate folders is one.

**default**: false
