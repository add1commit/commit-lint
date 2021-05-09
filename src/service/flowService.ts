import { QuickPickItem, window, Disposable, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';
import { State } from '../../typings/commitrc';
import { Commitrc, CommitrcRules } from '../../typings/commitrc';
import { isBoolean, isEmpty, mergeConfiguration } from '../utils';
import { getWorkspaceState } from '../utils/state';

export async function collectFlow(context: ExtensionContext, repo: Uri) {
    const { title, placeholder, types, rules, ignoreFocusOut }: Commitrc = await mergeConfiguration(getWorkspaceState(repo.fsPath));
    const skipButton = new Button(
        {
            dark: Uri.file(context.asAbsolutePath('resources/dark/stop.svg')),
            light: Uri.file(context.asAbsolutePath('resources/light/stop.svg')),
        },
        'Skip and finish',
    );
    async function collectInputs() {
        const state = {} as Partial<State>;
        await FlowService.run((input) => pickCommitType(input, state));
        return state as State;
    }

    // const title = 'Create Git Commit Message';

    async function pickCommitType(input: FlowService, state: Partial<State>) {
        state.type = (await input.showQuickPick({
            title: title?.type,
            ignoreFocusOut,
            step: 1,
            totalSteps: 5,
            placeholder: placeholder?.type,
            items: types || [],
            activeItem: state.type,
            shouldResume: shouldResume,
        })) as QuickPickItem;
        return (input: FlowService) => inputScope(input, state);
    }

    async function inputScope(input: FlowService, state: Partial<State>) {
        state.scope = await input.showInputBox({
            title: title?.scope,
            ignoreFocusOut,
            step: 2,
            totalSteps: 5,
            value: state.scope || '',
            placeholder: placeholder?.scope,
            prompt: '',
            validate: validateScope,
            shouldResume: shouldResume,
        });

        return (input: FlowService) => inputSubject(input, state);
    }

    async function inputSubject(input: FlowService, state: Partial<State>) {
        state.subject = await input.showInputBox({
            title: title?.subject,
            ignoreFocusOut,
            step: 3,
            totalSteps: 5,
            value: state.subject || '',
            placeholder: placeholder?.subject,
            prompt: '',
            validate: validateSubject,
            shouldResume: shouldResume,
        });

        return (input: FlowService) => inputBodyDescription(input, state);
    }

    async function inputBodyDescription(input: FlowService, state: Partial<State>) {
        const content = await input.showInputBox({
            title: title?.body,
            ignoreFocusOut,
            step: 4,
            totalSteps: 5,
            value: state.body || '',
            placeholder: placeholder?.body,
            buttons: [skipButton],
            prompt: '',
            validate: validateBodyDescription,
            shouldResume: shouldResume,
        });
        if (content instanceof Button) {
            return;
        }
        state.body = content;
        return (input: FlowService) => inputFooterDescription(input, state);
    }

    async function inputFooterDescription(input: FlowService, state: Partial<State>) {
        state.footer = await input.showInputBox({
            title: title?.footer,
            ignoreFocusOut,
            step: 5,
            totalSteps: 5,
            placeholder: placeholder?.footer,
            value: state.footer || '',
            prompt: '',
            validate: validateFooterDescription,
            shouldResume: shouldResume,
        });
    }

    function shouldResume() {
        // Could show a notification with the option to resume.
        return new Promise<boolean>((resolve, reject) => {
            // noop
        });
    }

    async function validateScope(scope: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { scopeEmpty, scopeMaxLength, scopeMinLength } = rules as CommitrcRules;
        if (isEmpty(scope)) {
            return !scopeEmpty;
        }
        if (scope.length >= scopeMaxLength) {
            return `Sorry, too many characters.（${scope.length}/${scopeMaxLength}) `;
        }
        if (scope.length < scopeMinLength) {
            return `Enter at least ${scopeMinLength} characters. `;
        }
    }
    async function validateSubject(subject: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { subjectEmpty, subjectMaxLength, subjectMinLength } = rules as CommitrcRules;
        if (isEmpty(subject)) {
            return !subjectEmpty;
        }
        if (subject.length >= subjectMaxLength) {
            return `Sorry, too many characters.（${subject.length}/${subjectMaxLength}) `;
        }
        if (subject.length < subjectMinLength) {
            return `Enter at least ${subjectMinLength} characters. `;
        }
    }

    async function validateBodyDescription(desc: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { bodyEmpty, bodyMaxLength, bodyMinLength } = rules as CommitrcRules;
        if (isEmpty(desc)) {
            return !bodyEmpty;
        }
        if (desc.length >= bodyMaxLength) {
            return `Sorry, too many characters.（${desc.length}/${bodyMaxLength}) `;
        }
        if (desc.length < bodyMinLength) {
            return `Enter at least ${bodyMinLength} characters. `;
        }
    }

    async function validateFooterDescription(desc: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { footerEmpty, footerMaxLength, footerMinLength } = rules as CommitrcRules;
        if (isEmpty(desc)) {
            return !footerEmpty;
        }
        if (desc.length >= footerMaxLength) {
            return `Sorry, too many characters.（${desc.length}/${footerMaxLength}) `;
        }
        if (desc.length < footerMinLength) {
            return `Enter at least ${footerMinLength} characters. `;
        }
    }

    return await collectInputs();
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class Button implements QuickInputButton {
    constructor(public iconPath: { light: Uri; dark: Uri }, public tooltip: string) {}
}

class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: FlowService) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string | undefined;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string | undefined;
    buttons?: QuickInputButton[];
    ignoreFocusOut: boolean;
    shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
    title: string | undefined;
    step: number;
    totalSteps: number;
    placeholder: string | undefined;
    value: string;
    prompt: string;
    validate: (value: string) => Promise<string | undefined | boolean>;
    buttons?: QuickInputButton[];
    ignoreFocusOut: boolean;
    shouldResume: () => Thenable<boolean>;
}

class FlowService {
    static async run<T>(start: InputStep) {
        const input = new FlowService();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough<T>(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, ignoreFocusOut, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title || 'Create Git Commit Message';
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                input.ignoreFocusOut = ignoreFocusOut;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
                disposables.push(
                    input.onDidTriggerButton((item) => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection((items) => resolve(items[0])),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        })().catch(reject);
                    }),
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach((d) => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, placeholder, value, prompt, validate, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title || 'Create Git Commit Message';
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.value = value || '';
                input.prompt = prompt;
                input.ignoreFocusOut = true;
                input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
                let validating = validate('');
                disposables.push(
                    input.onDidTriggerButton((item) => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async (text) => {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = isBoolean(validationMessage) ? undefined : validationMessage;
                        }
                    }),
                    input.onDidHide(() => {
                        (async () => {
                            reject(shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
                        })().catch(reject);
                    }),
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach((d) => d.dispose());
        }
    }
}
