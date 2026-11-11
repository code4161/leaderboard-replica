# P1 spec

Enter: P0 closed for the page.
Do: list the page's states from its chunk and its DOM, and write one scenario per state in evals/scenarios.json: `{"name","path","steps":[{"do":"click|fill|hover|press|scroll|wait","testid|text|css",...}]}`. Run the scenario against the original alone first; a scenario the original cannot complete is a wrong scenario.
Exit gate: scenarios exist for the default state and each interactive state.
