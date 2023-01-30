import {
  provideVSCodeDesignSystem,
  Button,
  TextField,
  vsCodeButton,
  vsCodeTag,
  vsCodeRadioGroup,
  vsCodeRadio,
  vsCodeTextField,
  RadioGroup,
  vsCodeCheckbox,
  vsCodePanels,
  vsCodePanelTab,
  vsCodePanelView,
  vsCodeDropdown,
  vsCodeOption
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTag(),
  vsCodeRadioGroup(),
  vsCodeRadio(),
  vsCodeTextField(),
  vsCodeCheckbox(),
  vsCodePanels(),
  vsCodePanelView(),
  vsCodePanelTab(),
  vsCodeDropdown(),
  vsCodeOption(),
);

const doc = document;
const win = window;
const vscode = acquireVsCodeApi();

win.addEventListener("load", main);

function main() {
  setVSCodeMessageListener();
  vscode.postMessage({ command: "requestConfigData" });

  // To get improved type annotations/IntelliSense the associated class for
  // a given toolkit component can be imported and used to type cast a reference
  // to the element (i.e. the `as Button` syntax)
  const saveButton = doc.getElementById("submit-button") as Button;
  saveButton.addEventListener("click", () => saveConfig());

  const addProfile = doc.getElementById("add-profile") as Button;
  addProfile.addEventListener("click", () => {
    appendProfile();
  });

  const protocols = doc.getElementById("protocol") as RadioGroup;
  protocols.addEventListener("change", function () {
    toggleProtocol(this.value);
  });
  toggleProtocol(protocols.value);
}

function toggleProtocol(val) {
  (doc.getElementById("privateKeyPath") as TextField).parentNode.parentNode.style.display = (val != 'sftp') ? 'none' : 'flex';
  (doc.getElementById("passphrase") as TextField).parentNode.parentNode.style.display = (val != 'sftp') ? 'none' : 'flex';
  (doc.getElementById("secure") as TextField).parentNode.parentNode.style.display = (val == 'sftp') ? 'none' : 'flex';
}

let openedConfig, configID: string = '';
const profilesDiv = doc.getElementById('profiles-items');

function setVSCodeMessageListener() {
  win.addEventListener("message", (event) => {
    const command = event.data.command;
    const id = event.data.id;
    const configData = event.data.config;
    switch (command) {
      case "receiveDataInWebview":
        openedConfig = configData;
        configID = id;
        drawProfiles(openedConfig.profiles || {});
        break;
    }
  });
}

function drawProfiles(profiles) {
  profilesDiv.innerHTML = '';
  Object.keys(profiles).forEach((profileName) => {
    let box = profileBox(profileName, profiles[profileName]);
    profilesDiv.appendChild(box);
  });
}

function appendProfile() {
  let box = profileBox("", {});
  profilesDiv.appendChild(box);
}
function getButton(label) {
  const button = doc.createElement('vscode-button') as Button;
  button.innerHTML = label;
  button.addEventListener("click", function () {
    let pr1 = this.parentNode.parentNode;
    let pr2 = pr1.parentNode;
    pr2.removeChild(pr1);
  });
  return button;
}
function getTextField(label, value, id) {
  const container = doc.createElement('div');
  container.className = 'form-row';

  const title = doc.createElement('span');
  title.className = 'title';
  title.innerHTML = label;

  const field = doc.createElement('span');
  field.className = 'field';
  title.innerHTML = label;

  const vscodeTextField = doc.createElement('vscode-text-field') as TextField;
  vscodeTextField.id = id;
  vscodeTextField.value = value;

  field.appendChild(vscodeTextField);

  container.appendChild(title);
  container.appendChild(field);
  return container;
}
function profileBox(profileName, profile) {
  let div = doc.createElement("div");
  div.setAttribute('data-name', profileName);
  let divi = doc.createElement("div");
  divi.className = 'block-fields';
  let divb = doc.createElement("div");
  divb.style = 'padding: 8px 0px;width: 50px;text-align: center;';

  const tfProfileID = getTextField('ID', profileName, 'profile-id');
  divi.appendChild(tfProfileID);
  const tfProfileName = getTextField('Name', profile.name || '', 'profile-name');
  divi.appendChild(tfProfileName);
  const tfProfileContext = getTextField('Local folder', profile.context || '', 'profile-context');
  divi.appendChild(tfProfileContext);
  const tfHostname = getTextField('Hostname', profile.host || '', 'profile-host');
  divi.appendChild(tfHostname);
  const tfPort = getTextField('Port', profile.port || '', 'profile-port');
  divi.appendChild(tfPort);
  const tfUsername = getTextField('Username', profile.username || '', 'profile-username');
  divi.appendChild(tfUsername);
  const tfPassword = getTextField('Password', profile.password || '', 'profile-password');
  divi.appendChild(tfPassword);
  const tfProfilePath = getTextField('Remote Path', profile.remotePath || '', 'profile-remotePath');
  divi.appendChild(tfProfilePath);
  const btnDiscard = getButton('[X]');
  divb.appendChild(btnDiscard);
  div.appendChild(divi);
  div.appendChild(divb);
  return div;
}

function getItemFromRow(item, n) {
  return item.childNodes[n].childNodes[1].childNodes[0];
}

function getItemsFromRow(bloc) {
  const pos = ['id', 'name', 'context', 'host', 'port', 'user', 'pass', 'remote'];
  let data = { id: '', name: '', context: '', host: '', port: '', user: '', pass: '', remote: '' };
  pos.forEach((v, k) => {
    data[v] = getItemFromRow(bloc, k).value;
  });
  return data;
}

function saveConfig() {
  const name = doc.getElementById("name") as TextField;
  const host = doc.getElementById("host") as TextField;
  const protocol = doc.getElementById("protocol") as RadioGroup;
  const uploadOnSave = doc.getElementById("uploadOnSave") as RadioGroup;
  const useTempFile = doc.getElementById("useTempFile") as RadioGroup;
  const port = doc.getElementById("port") as TextField;
  const username = doc.getElementById("username") as TextField;
  const password = doc.getElementById("password") as TextField;
  const context = doc.getElementById("context") as TextField;
  const ignore = doc.getElementById("ignore") as TextField;
  const ignoreRemote = doc.getElementById("ignoreRemote") as TextField;
  const remotePath = doc.getElementById("remotePath") as TextField;
  const privateKeyPath = doc.getElementById("privateKeyPath") as TextField;
  const passphrase = doc.getElementById("passphrase") as TextField;
  const secure = doc.getElementById("secure") as TextField;

  const watcherFiles = doc.getElementById("watcherFiles") as TextField;
  const watcherAutoUpload = doc.getElementById("watcherAutoUpload") as RadioGroup;
  const watcherAutoDelete = doc.getElementById("watcherAutoDelete") as RadioGroup;

  const ignoreValue = ignore?.value;
  const ignoreRemoteValue = ignoreRemote?.value;
  const privateKeyPathValue = privateKeyPath?.value;

  let configToUpdate = {
    // id: configID,
    name: name?.value,
    host: host?.value,
    protocol: protocol?.value,
    uploadOnSave: parseInt(uploadOnSave?.value) == 1,
    useTempFile: parseInt(useTempFile?.value) == 1,
    port: parseInt(port?.value),
    username: username?.value,
    // password: password?.value,
    ignore: ignoreValue.length ? ignoreValue.split(",").map((tag) => tag.trim()) : [],
    context: context?.value,
    remotePath: remotePath?.value,
    //privateKeyPath: privateKeyPath?.value,
  };
  if (watcherFiles?.value.length) {
    configToUpdate["watcher"] = {
      files: watcherFiles.value,
      autoUpload: parseInt(watcherAutoUpload.value) == 1,
      autoDelete: parseInt(watcherAutoDelete.value) == 1,
    };
  }
  if (ignoreRemoteValue.length) {
    configToUpdate["remoteExplorer"] = {
      filesExclude: ignoreRemoteValue.length ? ignoreRemoteValue.split(",").map((tag) => tag.trim()) : [],
    };
  }
  if (password?.value.length) {
    configToUpdate['password'] = password.value;
  }
  if (configToUpdate.protocol == 'sftp') {
    if (privateKeyPathValue.length > 0) {
      configToUpdate['privateKeyPath'] = privateKeyPathValue;
    }
    if (passphrase.length > 0) {
      configToUpdate['passphrase'] = passphrase;
    }
  } else {
    if (secure.value.length > 0 && secure.value != 'false') {
      if (secure.value == 'true') {
        configToUpdate['secure'] = true;
      } else {
        configToUpdate['secure'] = secure.value;
      }
    }
  }
  if (!configToUpdate.name || !configToUpdate.username) {
    vscode.postMessage({ command: "errorConfig", error: "Invalid data" });
    return;
  }
  let newProfiles = {};
  profilesDiv.childNodes.forEach((item) => {
    let newObj = {};
    let oldName = item.getAttribute('data-name');
    let pData = getItemsFromRow(item.childNodes[0]);

    if (pData.id) {
      if (pData.name.length) {
        newObj["name"] = pData.name;
      }
      if (pData.context.length) {
        newObj["context"] = pData.context;
      }
      if (pData.host.length) {
        newObj["host"] = pData.host;
      }
      if (pData.port.length) {
        newObj["port"] = pData.port;
      }
      if (pData.user.length) {
        newObj["username"] = pData.user;
      }
      if (pData.pass.length) {
        newObj["password"] = pData.pass;
      }
      if (pData.remote.length) {
        newObj["remotePath"] = pData.remote;
      }
      newProfiles[pData.id] = {
        ...(openedConfig.profiles[oldName] || {}),
        ...newObj
      };
    }
  });
  configToUpdate["profiles"] = newProfiles;
  let command = (configID && configID.length > 0) ? 'updateConfig' : 'saveConfig';
  console.log({ configToUpdate });
  vscode.postMessage({ command: command, id: configID, config: configToUpdate });
}