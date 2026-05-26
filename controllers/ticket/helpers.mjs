import * as db from '../../model/db.js';

// Builds the option groups for the category <select> on the create-ticket forms.
export const createOptions = async () => {
    // purpose is to fetch flatCategories: [
    //     { id, theme, name },
    //     ...
    // ]
    // then group them by theme into groupedCategories: [
    //     { 
    //        themeName, 
    //        options: [
    //          { id, name, selected }, ...
    //        ] 
    //     },
    //     ...
    // ]
    const flatCategories = await db.getAllCategories();

    return flatCategories.reduce((acc, item) => {
        const theme = item.theme;
        const displayName = item.name;

        let group = acc.find((g) => g.themeName === theme);
        if (!group) {
            group = { themeName: theme, options: [] };
            acc.push(group);
        }

        group.options.push({
            id: String(item.id),
            name: displayName,
        });
        return acc;
    }, []);
};

// Convenience role checkers used across ticket controllers.
export const isLeaderUser = (user) =>
    user?.role === 'leader' || user?.is_leader === 1;

export const isSecretaryUser = (user) =>
    Boolean(user?.secretary_id) && (user.role === 'secretary' || user.role === 'leader');
