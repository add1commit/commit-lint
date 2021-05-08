import { workspace } from "vscode";
import { extensionIdentifier } from "./constant";

export const getConfiguration = () => workspace.getConfiguration(extensionIdentifier);