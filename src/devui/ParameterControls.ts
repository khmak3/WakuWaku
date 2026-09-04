export class ParameterControls {
    private parameters: { [key: string]: any };

    constructor(parameters: { [key: string]: any }) {
        this.parameters = parameters;
        this.createControls();
    }

    private createControls() {
        const controlPanel = document.createElement('div');
        controlPanel.className = 'parameter-controls';

        for (const key in this.parameters) {
            const label = document.createElement('label');
            label.innerText = key;

            const input = document.createElement('input');
            input.type = 'range';
            input.min = '0';
            input.max = '100';
            input.value = this.parameters[key];
            input.addEventListener('input', () => {
                this.parameters[key] = Number(input.value);
                this.updateParameter(key, this.parameters[key]);
            });

            controlPanel.appendChild(label);
            controlPanel.appendChild(input);
        }

        document.body.appendChild(controlPanel);
    }

    private updateParameter(key: string, value: any) {
        console.log(`Parameter ${key} updated to ${value}`);
        // Additional logic to apply the updated parameter in the game can be added here
    }
}