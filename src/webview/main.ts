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
} from "@vscode/webview-ui-toolkit";
provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTag(),
  vsCodeRadioGroup(),
  vsCodeRadio(),
  vsCodeTextField()
);
const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  setVSCodeMessageListener();
  vscode.postMessage({ command: "requestConfigData" });

  // To get improved type annotations/IntelliSense the associated class for
  // a given toolkit component can be imported and used to type cast a reference
  // to the element (i.e. the `as Button` syntax)
  const saveButton = document.getElementById("submit-button") as Button;
  saveButton.addEventListener("click", () => saveConfig());
}

let openedConfig, configID;

function setVSCodeMessageListener() {
  window.addEventListener("message", (event) => {
    const command = event.data.command;
    const id = event.data.id;
    const configData = JSON.parse(event.data.config);

    switch (command) {
      case "receiveDataInWebview":
        openedConfig = configData;
        configID = id;
        console.log(configID);
        break;
    }
  });
}

function saveConfig() {

  const name = document.getElementById("name") as TextField;
  const host = document.getElementById("host") as TextField;
  const protocol = document.getElementById("protocol") as RadioGroup;
  const uploadOnSave = document.getElementById("uploadOnSave") as RadioGroup;
  const port = document.getElementById("port") as TextField;
  const username = document.getElementById("username") as TextField;
  const password = document.getElementById("password") as TextField;
  const context = document.getElementById("context") as TextField;
  const remotePath = document.getElementById("remotePath") as TextField;
  const privateKeyPath = document.getElementById("privateKeyPath") as TextField;
  console.log(configID);
  const configToUpdate = {
    id: configID,
    name: name?.value,
    host: host?.value,
    protocol: protocol?.value,
    uploadOnSave: uploadOnSave?.value,
    port: port?.value,
    username: username?.value,
    password: password?.value,
    context: context?.value,
    remotePath: remotePath?.value,
    privateKeyPath: privateKeyPath?.value,
  };

  vscode.postMessage({ command: "updateConfig", config: configToUpdate });
}