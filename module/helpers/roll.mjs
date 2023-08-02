export async function prepareRollDialog(sheet, type) {
  const { testName, templateData, testFunction, actorMastery } = getTestData(type, sheet);
  await createDialogAndSubmit(testName, templateData, sheet, testFunction, actorMastery);
}

function getTestData(type, sheet) {
  const testData = {
    narrative: {
      testName: game.i18n.localize("ARCHETERICALITE.NarrativeTest"),
      templateData: { narrative: true, modifier: true },
      testFunction: narrativeTest,
    },
    embarrassment: {
      testName: game.i18n.localize("ARCHETERICALITE.EmbarrassmentTest"),
      templateData: { modifier: true },
      testFunction: embarrassment,
    },
    brawl: {
      testName: `${game.i18n.localize("ARCHETERICALITE.MasteryTest")}: ${game.i18n.localize(
        "ARCHETERICALITE.Brawl"
      )}`,
      templateData: { mastery: true },
      testFunction: masteryTest,
      actorMastery: sheet.object.system.combat.brawl,
    },
    fencing: {
      testName: `${game.i18n.localize("ARCHETERICALITE.MasteryTest")}: ${game.i18n.localize(
        "ARCHETERICALITE.Fencing"
      )}`,
      templateData: { mastery: true },
      testFunction: masteryTest,
      actorMastery: sheet.object.system.combat.fencing,
    },
    firearms: {
      testName: `${game.i18n.localize("ARCHETERICALITE.MasteryTest")}: ${game.i18n.localize(
        "ARCHETERICALITE.Firearms"
      )}`,
      templateData: { mastery: true },
      testFunction: masteryTest,
      actorMastery: sheet.object.system.combat.firearms,
    },
    throwing: {
      testName: `${game.i18n.localize("ARCHETERICALITE.MasteryTest")}: ${game.i18n.localize(
        "ARCHETERICALITE.Throwing"
      )}`,
      templateData: { mastery: true },
      testFunction: masteryTest,
      actorMastery: sheet.object.system.combat.throwing,
    },
    damage: {
      testName: game.i18n.localize("ARCHETERICALITE.Damage"),
      templateData: { damage: true },
      testFunction: rollDamage,
    },
    imago: {
      testName: game.i18n.localize("ARCHETERICALITE.ImagoTest"),
      templateData: { imago: true, modifier: true },
      testFunction: imagoTest,
    },
    default: {
      testName: game.i18n.localize("ARCHETERICALITE.StandartTest"),
      templateData: { customDifficulty: true, modifier: true },
      testFunction: standartTest,
    },
  };

  return testData[type] || testData.default;
}

async function createDialogAndSubmit(testName, templateData, sheet, testFunction, actorMastery) {
  const html = await renderTemplate("systems/archetericalite/templates/apps/rollDialog.hbs", templateData);
  const dialog = new Dialog({
    title: testName,
    content: html,
    buttons: {
      roll: {
        label: game.i18n.localize("ARCHETERICALITE.Roll"),
        icon: '<i class="fas fa-dice"></i>',
        callback: async (html) => {
          try {
            const formData = new FormData(html[0].querySelector("form"));
            const data = toIntData(Object.fromEntries(formData.entries()));

            const speaker = ChatMessage.getSpeaker({ actor: sheet.actor });
            await testFunction(testName, speaker, data, sheet, actorMastery);
          } catch (error) {
            console.error("Error submit in roll dialog:", error);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("ARCHETERICALITE.RollCancel"),
        callback: () => {},
      },
    },
    default: "roll",
    close: () => {},
  });
  dialog.render(true);
}

function toIntData(data) {
  data.narrativeDifficulty = parseInt(data.narrativeDifficulty, 10);
  data.opponentMastery = parseInt(data.opponentMastery, 10);
  data.opponentImago = parseInt(data.opponentImago, 10);
  data.advantage = parseInt(data.advantage, 10);
  data.lethality = parseInt(data.lethality, 10);
  data.customDifficulty = parseInt(data.customDifficulty, 10);
  data.modifier = parseInt(data.modifier, 10);

  return data;
}

function narrativeTest(testName, speaker, data, sheet) {
  const infirmity = sheet.object.system.infirmity;
  const difficulty = data.narrativeDifficulty;
  const modifier = data.modifier;
  rollDice(testName, speaker, modifier, difficulty, infirmity);
}

function embarrassment(testName, speaker, data, sheet) {
  const difficulty = sheet.object.system.stress;
  const modifier = data.modifier;
  rollDice(testName, speaker, modifier, difficulty);
}

function masteryTest(testName, speaker, data, sheet, actorMastery) {
  const infirmity = sheet.object.system.infirmity;
  const modifier = data.advantage;
  const opponentMastery = data.opponentMastery;
  const difficulty = 7 - actorMastery + opponentMastery;
  rollDice(testName, speaker, modifier, difficulty, null, infirmity);
}

function imagoTest(testName, speaker, data, sheet) {
  const modifier = data.modifier;
  const opponentImago = data.opponentImago;
  const actorImago = sheet.object.system.mystical.imago;
  const difficulty = 7 - actorImago + opponentImago;
  rollDice(testName, speaker, modifier, difficulty);
}

function standartTest(testName, speaker, data) {
  const modifier = data.modifier;
  const difficulty = data.customDifficulty;
  rollDice(testName, speaker, modifier, difficulty);
}

async function rollDice(testName, speaker, modifier, difficulty, infirmity) {
  try {
    const roll = new Roll("2d6");
    await roll.evaluate({ async: true });

    let rollResult = {
      commonDice: roll.terms[0].results.map((result) => ({ value: result.result, used: false })),
      infirmityDice: [],
      success: false,
      fainting: false,
      panic: false,
      total: 0
    };

    rollResult.total = rollResult.commonDice[0].value + rollResult.commonDice[1].value + modifier;

    if (infirmity > 0) {
      rollResult = await rollInfirmity(infirmity, rollResult);
      rollResult.total += modifier;
    }

    rollResult.success = rollResult.total >= difficulty;

    const renderData = { testName, modifier, difficulty, rollResult };
    await renderAndSendRollResult(speaker, renderData);
  } catch (error) {
    console.error("Error performing roll:", error);
  }
}

async function rollInfirmity(infirmity, rollResult) {
  try {
    const roll = new Roll("2d6");
    await roll.evaluate({ async: true });
    rollResult.total = 0;

    const infirmityHandlers = {
      1: () => {
        return [{ value: roll.terms[0].results[0].result, used: false }];
      },
      2: () => {
        return roll.terms[0].results.map((result) => ({ value: result.result, used: false }));
      },
      3: () => {
        let resultsArray = roll.terms[0].results.map((result) => result.result);
        resultsArray = resultsArray.concat(resultsArray.map((result) => 7 - result));
        return resultsArray.map((result) => ({ value: result, used: false }));
      },
      default: () => {
        rollResult.fainting = true;
        return null;
      },
    };

    rollResult.infirmityDice = infirmityHandlers[infirmity]?.() || infirmityHandlers.default?.();

    if (!rollResult.fainting) {
      rollResult.commonDice.forEach(function (value, i) {
        const infirmityIndex = rollResult.infirmityDice.findIndex((dice) => dice.value === value.value && !dice.used);
        if (infirmityIndex !== -1 && !value.used) {
          rollResult.commonDice[i].used = true;
          rollResult.infirmityDice[infirmityIndex].used = true;
        } else if (!value.used) {
          rollResult.total += value.value
        }
      });

      if (rollResult.total === 0) {
        rollResult.fainting = true;
      }
    }

    return rollResult;
  } catch (error) {
    console.error("Error performing infirmity roll:", error);
  }
}


async function rollDamage(testName, speaker, data) {
  try {
    const damage = data.damage;
    const modifier = data.lethality;

    let rollResult = {
      commonDice: [],
      total: 0
    };

    if (damage !== "2") {
      const roll = new Roll("@damage+@modifier", { damage, modifier });
      await roll.evaluate({ async: true });
      rollResult.commonDice = [{ value: roll.dice[0].results[0].result }, { value: roll.dice[0].results[1].result }];
      rollResult.total = roll.total;
    } else {
      rollResult.total = 2 + modifier;
    }

    const renderData = { testName, modifier, rollResult };
    await renderAndSendRollResult(speaker, renderData);
  } catch (error) {
    console.error("Error in rollDamage:", error);
  }
}

async function renderAndSendRollResult(speaker, renderData) {
  try {
    const chatMessage = await renderTemplate("systems/archetericalite/templates/apps/rollResult.hbs", renderData);
    const chatData = {
      speaker: speaker,
      content: chatMessage,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    };
    ChatMessage.create(chatData);
  } catch (error) {
    console.error("Error rendering and sending roll result:", error);
  }
}
