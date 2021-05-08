import { QuickPickItem } from 'vscode';

export interface State {
    title: string;
    step: number;
    totalSteps: number;
    type: QuickPickItem;
    scope: string;
    subject: string;
    body: string;
    footer: string;
}

export interface Commitrc {
    title?: CommitrcLabelItem;
    placeholder?: CommitrcLabelItem;
    types?: CommitrcOptionItem[];
    rules?: CommitrcRules;
    ignoreFocusOut: boolean;
}

export interface CommitrcRules {
    scopeEmpty: boolean;
    subjectEmpty: boolean;
    bodyEmpty: boolean;
    footerEmpty: boolean;

    scopeMaxLength: number;
    scopeMinLength: number;
    subjectMaxLength: number;
    subjectMinLength: number;
    bodyMinLength: number;
    bodyMaxLength: number;

    footerMaxLength: number;
    footerMinLength: number;
}

export interface CommitrcLabelItem {
    type?: string;
    scope?: string;
    subject?: string;
    body?: string;
    footer?: string;
}

export interface CommitrcOptionItem {
    label: string;
    detail: string;
    visible?: boolean;
}
