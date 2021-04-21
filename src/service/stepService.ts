import { QuickPickItem, window, Disposable, QuickInputButton, QuickInput, ExtensionContext, QuickInputButtons, Uri } from 'vscode';

/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `StepService` that wraps the API for the multi-step case.
 */
export interface State {
    title: string;
    step: number;
    totalSteps: number;
    type: QuickPickItem;
    scope: QuickPickItem;
    subject: string;
    body: string;
    footer: string;
}

export async function initCommitLint(context: ExtensionContext) {
    class Button implements QuickInputButton {
        constructor(public iconPath: { light: Uri; dark: Uri }, public tooltip: string) {}
    }

    const skipButton = new Button(
        {
            dark: Uri.file(context.asAbsolutePath('resources/icons/check_dark.svg')),
            light: Uri.file(context.asAbsolutePath('resources/icons/check_light.svg')),
        },
        'Skip and finish',
    );

    async function collectInputs() {
        const state = {} as Partial<State>;
        await StepService.run((input) => pickCommitType(input, state));
        return state as State;
    }

    const title = 'Create Git Commit Message';

    const types: QuickPickItem[] = [{ label: 'Feat', detail: 'New features completed' }];

    const scopes: QuickPickItem[] = ['api', 'api1', 'api2'].map((label) => ({ label }));

    async function pickCommitType(input: StepService, state: Partial<State>) {
        state.type = (await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 5,
            placeholder: 'Pick a type of this commit',
            items: types,
            activeItem: state.type,
            shouldResume: shouldResume,
        })) as QuickPickItem;

        return (input: StepService) => pickCommitScope(input, state);
    }

    async function pickCommitScope(input: StepService, state: Partial<State>) {
        state.scope = (await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 5,
            placeholder: 'Pick a scope of this commit',
            items: scopes,
            activeItem: state.scope,
            shouldResume: shouldResume,
        })) as QuickPickItem;

        return (input: StepService) => inputSubject(input, state);
    }

    async function inputSubject(input: StepService, state: Partial<State>) {
        state.subject = await input.showInputBox({
            title,
            step: 3,
            totalSteps: 5,
            value: state.subject || '',
            prompt: 'Choose a unique name for the Application Service',
            validate: validateSubject,
            shouldResume: shouldResume,
        });

        return (input: StepService) => inputBodyDescription(input, state);
    }

    async function inputBodyDescription(input: StepService, state: Partial<State>) {
        const content = await input.showInputBox({
            title,
            step: 4,
            totalSteps: 5,
            value: state.body || '',
            buttons: [skipButton],
            prompt: 'Choose a unique name for the Application Service',
            validate: validateBodyDescription,
            shouldResume: shouldResume,
        });
        if (content instanceof Button) {
            return;
        }
        state.body = content;
        return (input: StepService) => inputFooterDescription(input, state);
    }

    async function inputFooterDescription(input: StepService, state: Partial<State>) {
        state.footer = await input.showInputBox({
            title,
            step: 5,
            totalSteps: 5,
            value: state.footer || '',
            prompt: 'Choose a unique name for the Application Service',
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

    async function validateSubject(subject: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return subject === 'vscode' ? 'Name not unique' : undefined;
    }

    async function validateBodyDescription(desc: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return desc === 'vscode' ? 'Name not unique' : undefined;
    }

    async function validateFooterDescription(desc: string) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return desc === 'vscode' ? 'Name not unique' : undefined;
    }

    return await collectInputs();
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: StepService) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt: string;
    validate: (value: string) => Promise<string | undefined>;
    buttons?: QuickInputButton[];
    shouldResume: () => Thenable<boolean>;
}

class StepService {
    static async run<T>(start: InputStep) {
        const input = new StepService();
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

    async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
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

    async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
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
                            input.validationMessage = validationMessage;
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
