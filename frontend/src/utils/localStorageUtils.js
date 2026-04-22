/**
 * Utility to clear property addition drafts from localStorage.
 * This ensures that when a user clicks "Add Property", they start with a fresh form.
 */
export const clearPropertyDrafts = () => {
    const keys = [
        'rukko_hotel_wizard_draft_new',
        'rukko_villa_wizard_draft_new',
        'rukko_hostel_wizard_draft_new',
        'rukko_pg_wizard_draft_new',
        'rukko_resort_wizard_draft_new',
        'rukko_homestay_wizard_draft_new',
        'rukko_tent_wizard_draft_new'
    ];
    
    keys.forEach(key => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Failed to remove draft key: ${key}`, e);
        }
    });
};
