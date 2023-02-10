/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/archetericalite/templates/actor/parts/actor-narrative.hbs",
    "systems/archetericalite/templates/actor/parts/actor-combat.hbs",
    "systems/archetericalite/templates/actor/parts/actor-mystical.hbs",
    "systems/archetericalite/templates/actor/parts/actor-riches.hbs",
    "systems/archetericalite/templates/actor/parts/actor-description.hbs",
    "systems/archetericalite/templates/actor/parts/npc-general.hbs",
    "systems/archetericalite/templates/actor/parts/npc-combat.hbs"
  ]);
};
