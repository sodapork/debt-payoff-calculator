class DebtCalculator {
    constructor() {
        this.debts = [];
        this.editIndex = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('debtForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editIndex !== null) {
                this.updateDebt();
            } else {
                this.addDebt();
            }
        });

        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculatePayoffStrategies();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.cancelEdit();
        });
    }

    addDebt() {
        const name = document.getElementById('debtName').value;
        const amount = parseFloat(document.getElementById('debtAmount').value);
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value);

        const debt = {
            name,
            amount,
            interestRate,
            monthlyPayment,
            remainingBalance: amount
        };

        this.debts.push(debt);
        this.updateDebtsList();
        this.updateCalculateButton();
        document.getElementById('debtForm').reset();
    }

    editDebt(index) {
        const debt = this.debts[index];
        document.getElementById('debtName').value = debt.name;
        document.getElementById('debtAmount').value = debt.amount;
        document.getElementById('interestRate').value = debt.interestRate;
        document.getElementById('monthlyPayment').value = debt.monthlyPayment;
        this.editIndex = index;
        document.querySelector('#debtForm button[type="submit"]').textContent = 'Update Debt';
        document.getElementById('cancelEditBtn').classList.remove('d-none');
    }

    updateDebt() {
        const name = document.getElementById('debtName').value;
        const amount = parseFloat(document.getElementById('debtAmount').value);
        const interestRate = parseFloat(document.getElementById('interestRate').value);
        const monthlyPayment = parseFloat(document.getElementById('monthlyPayment').value);
        this.debts[this.editIndex] = {
            name,
            amount,
            interestRate,
            monthlyPayment,
            remainingBalance: amount
        };
        this.editIndex = null;
        this.updateDebtsList();
        this.updateCalculateButton();
        document.getElementById('debtForm').reset();
        document.querySelector('#debtForm button[type="submit"]').textContent = 'Add Debt';
        document.getElementById('cancelEditBtn').classList.add('d-none');
    }

    cancelEdit() {
        this.editIndex = null;
        document.getElementById('debtForm').reset();
        document.querySelector('#debtForm button[type="submit"]').textContent = 'Add Debt';
        document.getElementById('cancelEditBtn').classList.add('d-none');
    }

    removeDebt(index) {
        this.debts.splice(index, 1);
        this.updateDebtsList();
        this.updateCalculateButton();
        if (this.editIndex === index) {
            this.cancelEdit();
        }
    }

    updateDebtsList() {
        const debtsList = document.getElementById('debtsList');
        debtsList.innerHTML = '';

        this.debts.forEach((debt, index) => {
            const debtElement = document.createElement('div');
            debtElement.className = 'debt-item';
            debtElement.innerHTML = `
                <span class="remove-debt" onclick="calculator.removeDebt(${index})">×</span>
                <span class="edit-debt text-primary" style="cursor:pointer;margin-right:8px;" onclick="calculator.editDebt(${index})">✎</span>
                <strong>${debt.name}</strong><br>
                Amount: $${debt.amount.toFixed(2)}<br>
                Interest Rate: ${debt.interestRate}%<br>
                Monthly Payment: $${debt.monthlyPayment.toFixed(2)}
            `;
            debtsList.appendChild(debtElement);
        });
    }

    updateCalculateButton() {
        const calculateBtn = document.getElementById('calculateBtn');
        calculateBtn.disabled = this.debts.length === 0;
    }

    calculatePayoffStrategies() {
        const avalancheResults = this.calculateAvalancheMethod();
        const snowballResults = this.calculateSnowballMethod();
        
        this.displayResults(avalancheResults, snowballResults);
    }

    calculateAvalancheMethod() {
        // Sort debts by interest rate (highest to lowest)
        const sortedDebts = [...this.debts].sort((a, b) => b.interestRate - a.interestRate);
        return this.calculatePayoffSchedule(sortedDebts);
    }

    calculateSnowballMethod() {
        // Sort debts by amount (smallest to largest)
        const sortedDebts = [...this.debts].sort((a, b) => a.amount - b.amount);
        return this.calculatePayoffSchedule(sortedDebts);
    }

    calculatePayoffSchedule(sortedDebts) {
        const schedule = [];
        let month = 0;
        let totalInterestPaid = 0;
        let remainingDebts = sortedDebts.map(debt => ({
            ...debt,
            remainingBalance: debt.amount
        }));

        while (remainingDebts.length > 0) {
            month++;
            let extraPayment = 0;

            // Calculate minimum payments and track paid off debts
            remainingDebts = remainingDebts.filter(debt => {
                const monthlyInterest = debt.remainingBalance * (debt.interestRate / 100 / 12);
                const principalPayment = debt.monthlyPayment - monthlyInterest;
                
                if (principalPayment >= debt.remainingBalance) {
                    extraPayment += debt.monthlyPayment - debt.remainingBalance;
                    totalInterestPaid += monthlyInterest;
                    return false;
                }

                debt.remainingBalance -= principalPayment;
                totalInterestPaid += monthlyInterest;
                return true;
            });

            // Apply extra payment to the first remaining debt
            if (extraPayment > 0 && remainingDebts.length > 0) {
                remainingDebts[0].remainingBalance -= extraPayment;
            }

            schedule.push({
                month,
                remainingDebts: remainingDebts.map(d => ({
                    name: d.name,
                    remainingBalance: d.remainingBalance
                })),
                totalInterestPaid
            });
        }

        return {
            totalMonths: month,
            totalInterestPaid,
            schedule
        };
    }

    displayResults(avalancheResults, snowballResults) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.classList.remove('d-none');

        // Determine the best method (lowest total interest paid)
        let best = null;
        if (avalancheResults.totalInterestPaid < snowballResults.totalInterestPaid) {
            best = 'avalanche';
        } else if (snowballResults.totalInterestPaid < avalancheResults.totalInterestPaid) {
            best = 'snowball';
        } else {
            best = 'tie';
        }

        // Display Avalanche results
        const avalancheDiv = document.getElementById('avalancheResults');
        avalancheDiv.innerHTML = this.createResultsHTML(avalancheResults, best === 'avalanche');
        avalancheDiv.parentElement.querySelector('h6').innerHTML = `Debt Avalanche Method${best === 'avalanche' ? ' <span title=\"Best Option\" style=\"color:green;font-size:1.2em;\">✅</span>' : ''}`;
        avalancheDiv.parentElement.classList.toggle('border-success', best === 'avalanche');
        avalancheDiv.parentElement.classList.toggle('border-2', best === 'avalanche');

        // Display Snowball results
        const snowballDiv = document.getElementById('snowballResults');
        snowballDiv.innerHTML = this.createResultsHTML(snowballResults, best === 'snowball');
        snowballDiv.parentElement.querySelector('h6').innerHTML = `Debt Snowball Method${best === 'snowball' ? ' <span title=\"Best Option\" style=\"color:green;font-size:1.2em;\">✅</span>' : ''}`;
        snowballDiv.parentElement.classList.toggle('border-success', best === 'snowball');
        snowballDiv.parentElement.classList.toggle('border-2', best === 'snowball');

        // Add comparison summary
        const summary = document.createElement('div');
        summary.className = 'summary-box mt-4';
        summary.innerHTML = `
            <h6>Comparison Summary</h6>
            <p>Debt Avalanche Method:</p>
            <ul>
                <li>Total months to pay off: ${avalancheResults.totalMonths}</li>
                <li>Total interest paid: $${avalancheResults.totalInterestPaid.toFixed(2)}</li>
            </ul>
            <p>Debt Snowball Method:</p>
            <ul>
                <li>Total months to pay off: ${snowballResults.totalMonths}</li>
                <li>Total interest paid: $${snowballResults.totalInterestPaid.toFixed(2)}</li>
            </ul>
            <p><strong>Difference in interest paid: $${Math.abs(avalancheResults.totalInterestPaid - snowballResults.totalInterestPaid).toFixed(2)}</strong></p>
        `;
        // Remove previous summary if any
        const oldSummary = resultsDiv.querySelector('.summary-box.mt-4');
        if (oldSummary) oldSummary.remove();
        resultsDiv.appendChild(summary);
    }

    createResultsHTML(results, isBest) {
        return `
            <div class="summary-box${isBest ? ' border-success border-2" style="box-shadow:0 0 10px #19875433;"' : '"'}>
                <p>Total months to pay off: ${results.totalMonths}</p>
                <p>Total interest paid: $${results.totalInterestPaid.toFixed(2)}</p>
            </div>
            <h6 class="mt-3">Payoff Schedule</h6>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Remaining Debts</th>
                        <th>Total Interest Paid</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.schedule.map(month => `
                        <tr>
                            <td>${month.month}</td>
                            <td>${month.remainingDebts.map(d => 
                                `${d.name}: $${d.remainingBalance.toFixed(2)}`
                            ).join('<br>')}</td>
                            <td>$${month.totalInterestPaid.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

// Initialize the calculator
const calculator = new DebtCalculator(); 