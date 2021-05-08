import { window } from 'vscode';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE';

export class LoggingService {
    private outputChannel = window.createOutputChannel('Commit Lint');

    private logLevel: LogLevel = 'INFO';

    public setOutputLevel(logLevel: LogLevel) {
        this.logLevel = logLevel;
    }

    public debug(message: string, data?: unknown): void {
        if (['NONE', 'INFO', 'WARN', 'ERROR'].includes(this.logLevel)) {
            return;
        }
        this.logMessage(message, 'INFO');
        if (data) {
            this.logObject(data);
        }
    }

    public info(message: string, data?: unknown): void {
        if (['NONE', 'WARN', 'ERROR'].includes(this.logLevel)) {
            return;
        }
        this.logMessage(message, 'INFO');
        if (data) {
            this.logObject(data);
        }
    }

    public warning(message: string, data?: unknown): void {
        if (['NONE', 'ERROR'].includes(this.logLevel)) {
            return;
        }
        this.logMessage(message, 'WARN');
        if (data) {
            this.logObject(data);
        }
    }

    public error(message?: string, error?: Error | string): void {
        if (['ERROR'].includes(this.logLevel)) {
            return;
        }
        if (message) {
            this.logMessage(message, 'ERROR');
        }

        if (typeof error === 'string') {
            this.outputChannel.appendLine(error);
        } else if (error?.message || error?.stack) {
            if (error?.message) {
                this.logMessage(error.message, 'ERROR');
            }
            if (error?.stack) {
                this.outputChannel.appendLine(error.stack);
            }
        } else if (error) {
            this.logObject(error);
        }
    }

    public show() {
        this.outputChannel.show();
    }

    private logObject(data: unknown): void {
        const message = JSON.stringify(data, null, 2);
        this.outputChannel.appendLine(message);
    }

    /**
     * Append messages to the output channel and format it with a title
     *
     * @param message The message to append to the output channel
     */
    private logMessage(message: string, logLevel: LogLevel): void {
        const title = new Date().toLocaleTimeString();
        this.outputChannel.appendLine(`["${logLevel}" - ${title}] ${message}`);
    }
}
