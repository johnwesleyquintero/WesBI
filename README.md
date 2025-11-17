# WesBI - FBA Intelligence Cockpit

An advanced FBA intelligence cockpit for real-time Amazon operations analytics. This tool empowers Amazon FBA sellers to transform raw inventory snapshot CSVs into a strategic command center. Analyze inventory health, sales performance, and potential risks with a powerful dashboard, and leverage AI-powered insights to make smarter, data-driven decisions that boost profitability.

---

## ✨ Key Features

*   **Interactive Dashboard:** Get a high-level overview of your entire FBA operation with key metrics like Total SKUs, Available Inventory, Pending Removals, Sell-Through Rate, Average Inventory Age, and At-Risk SKUs.

*   **AI Intelligence Layer (Powered by Google Gemini):**
    *   **Automated Insights Panel:** As soon as you process a snapshot, the app automatically generates concise, actionable business insights, helping you spot opportunities and risks immediately.
    *   **AI Strategy Session & Mission Control:** Go beyond insights and generate a complete, step-by-step operational playbook. Select a high-level business goal (e.g., 'Liquidate High-Risk Inventory'), and the AI will create a detailed plan. You can then launch this plan as a trackable "Mission" with a live KPI chart and an interactive checklist right on your dashboard.
    *   **Context-Aware Chatbot:** Have a conversation with your data. The AI chatbot is primed with a summary of your active snapshot, allowing you to ask specific questions and get detailed answers in a natural, conversational way.

*   **Deep Data Analysis & Comparison:**
    *   **Snapshot Comparison Mode:** Upload two different snapshot files to track trends over time. The dashboard and data table instantly switch to show per-SKU deltas for inventory levels, sales velocity, and risk scores.
    *   **Advanced Data Table:**
        *   **Powerful Filtering & Search:** Instantly search by SKU, ASIN, or Product Name. Drill down with filters for Inventory Age, Recommended Action, Stock Status (Low, High, Stranded), and more.
        *   **Multi-Column Sorting:** Sort your entire dataset by any metric. Hold `Shift` and click multiple column headers to apply secondary and tertiary sorting.
        *   **Conditional Highlighting:** Rows are automatically color-coded based on risk score, sales velocity, and recommended actions.
    *   **Customizable Pagination:** Adjust the number of rows displayed per page (30, 50, 100, or 250).

*   **Operational & Forecasting Tools:**
    *   **Proactive Alert Center:** Automatically identifies and flags critical operational issues, such as stockout risks, sales stagnation trends (in comparison mode), and SKUs accruing long-term storage fees.
    *   **Restock Forecasting:** Proactively manage your inventory with calculated restock recommendations. Fine-tune forecasts by adjusting Supplier Lead Time, Safety Stock days, and overall Demand Forecast percentage.
    *   **CSV Export:** Export your current filtered and sorted data to a new CSV file with a single click.

*   **Robust User Experience:**
    *   **State Persistence:** Your user settings—including filters, sort preferences, forecast configurations, API key, and items per page—are automatically saved in your browser.
    *   **In-App User Guide:** A comprehensive help modal (accessible via the **?** icon) explains every feature in detail.
    *   **Fully Responsive:** The entire interface is designed to work seamlessly on desktop, tablet, and mobile devices.

## 🛠️ Technology Stack

This project is built as a modern, self-contained single-page application, leveraging a powerful stack for optimal performance and user experience.

*   **Frontend:**
    *   **React:** For building a dynamic and component-based user interface.
    *   **TypeScript:** For robust, type-safe code that is easier to maintain and scale.
    *   **Tailwind CSS:** For rapid, utility-first styling and a clean, modern design.
*   **Artificial Intelligence:**
    *   **Google Gemini API (`@google/genai`):** Powers the "AI-Powered Insights," "AI Strategy Session," and "Chatbot" features.
*   **Data Handling & Visualization:**
    *   **PapaParse:** A high-performance, in-browser CSV parser used to efficiently process FBA snapshot files.
    *   **Recharts:** A composable charting library built on React components for creating interactive data visualizations.

## ⚙️ How to Use

1.  **Launch the Application:** Open the app in your browser.

2.  **Configure AI (Recommended):**
    *   Click the **cog icon (⚙️)** in the header to open Settings.
    *   Enter your personal **Google Gemini API Key**. This unlocks all AI features. Your key is saved securely in your browser's local storage and is never sent to our servers.
    *   You can also toggle AI features on or off from here.

3.  **Upload Your Data:**
    *   Drag and drop one or more of your FBA Inventory Snapshot `.csv` files into the **"FBA Snapshots"** zone.
    *   Click **"Process Files"**. The app will parse the files, calculate all metrics, and generate AI insights.

4.  **Analyze Your Dashboard:**
    *   Review the top-level **Stat Cards** for a quick health check.
    *   Read the **AI-Powered Insights** for immediate, actionable advice.
    *   Examine the **Charts** for a visual breakdown of inventory age and risk.

5.  **Generate an AI Strategy & Start a Mission:**
    *   Click the **"AI Strategy"** button.
    *   Select a business goal (e.g., "Reduce Long-Term Storage Fees").
    *   Click **"Generate Plan"** to receive a detailed, step-by-step action plan.
    *   Click **"Start Mission"**. A **Mission Control** panel will now appear on your dashboard, allowing you to track your progress with a live KPI chart and an interactive checklist.

6.  **Drill Down and Investigate:**
    *   Use the **search bar** and **filters** to isolate specific products.
    *   Click on column headers to sort the data. Hold **Shift** while clicking to sort by multiple columns.
    *   Use the **Chatbot** (bottom-right icon) to ask specific questions about the data.

7.  **Compare Snapshots:**
    *   After loading at least two snapshots, click the **"Compare..."** button.
    *   Select your "Base" (older) and "Compare" (newer) snapshots.
    *   The dashboard will now show the changes (deltas) between the two periods.

8.  **Export Your View:**
    *   Click the **"Export"** button at any time to download the currently displayed data (with all filters and sorting applied) as a new CSV file.

---

This tool was designed to be a force multiplier for FBA sellers, turning complex data into a clear strategic advantage. Unlock your data's full potential.
