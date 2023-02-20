/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ArchetericaLiteActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["archetericalite", "sheet", "actor", "character"],
      template: "systems/archetericalite/templates/actor/actor-sheet.hbs",
      width: 750,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "narrative" }]
    });
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["archetericalite", "sheet", "actor", "npc"],
      template: "systems/archetericalite/templates/actor/actor-sheet.hbs",
      width: 750,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "general" }]
    });
  }

  /** @override */
  get template() {
    if ( !game.user.isGM && this.actor.limited ) return "systems/archetericalite/templates/actor/limited-sheet.hbs";
    return `systems/archetericalite/templates/actor/${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const biography = [];
    const attribute = [];
    const negative = [];
    const comtals = {
      2: [],
      3: [],
      4: [],
      5: [],
      6: []
    };
    const metamorphosis = [];
    const ability = [];
    const loot = [];
    const protection = [];
    const weapon = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to biography bonus.
      if (i.type === 'biography') {
        biography.push(i);
      }
      // Append to attribute.
      else if (i.type === 'attribute') {
        attribute.push(i);
      }
      // Append to negative.
      else if (i.type === 'negative') {
        negative.push(i);
      }
      // Append to combat talent.
      else if (i.type === 'comtal') {
        if (i.system.comtalRank != undefined) {
          comtals[i.system.comtalRank].push(i);
        }
      }
      // Append to ability.
      else if (i.type === 'ability') {
        ability.push(i);2
      }
      // Append to metamorphosis.
      else if (i.type === 'metamorphosis') {
        metamorphosis.push(i);
      }
      // Append to loot.
      else if (i.type === 'loot') {
        loot.push(i);
      }
      // Append to protection.
      else if (i.type === 'protection') {
        protection.push(i);
      }
      // Append to weapon.
      else if (i.type === 'weapon') {
        weapon.push(i);
      }
    }

    // Assign and return
    context.biography = biography;
    context.attribute = attribute;
    context.negative = negative;
    context.comtals = comtals;
    context.ability = ability;
    context.metamorphosis = metamorphosis;
    context.loot = loot;
    context.protection = protection;
    context.weapon = weapon;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(hbs) {
    super.activateListeners(hbs);

    // Render the item sheet for viewing/editing prior to the editable check.
    hbs.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    hbs.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    hbs.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable.
    hbs.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      hbs.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = game.i18n.localize("ARCHETERICALITE.NewItem") + " " + game.i18n.localize(`ITEM.Type${type.capitalize()}`);
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
