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
      testFunction: damageTest,
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
            const data = Object.fromEntries(formData.entries());

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

function narrativeTest(testName, speaker, data, sheet) {
  const infirmity = sheet.object.system.infirmity;
  const stress = sheet.object.system.stress;
  const difficulty = data.narrativeDifficulty;
  const modifier = data.modifier;
  rollDice(testName, speaker, modifier, difficulty, stress, infirmity);
}

function embarrassment(testName, speaker, data, sheet) {
  const difficulty = sheet.object.system.stress;
  const modifier = data.modifier;
  rollDice(testName, speaker, modifier, difficulty);
}

function masteryTest(testName, speaker, data, sheet, actorMastery) {
  const infirmity = sheet.object.system.infirmity;
  const modifier = data.advantage;
  const opponentMastery = parseInt(data.opponentMastery, 10);
  const difficulty = 7 - actorMastery + opponentMastery;
  rollDice(testName, speaker, modifier, difficulty, null, infirmity);
}

function imagoTest(testName, speaker, data, sheet) {
  const modifier = data.modifier;
  const opponentImago = parseInt(data.opponentImago, 10);
  const actorImago = sheet.object.system.mystical.imago;
  const difficulty = 7 - actorImago + opponentImago;
  rollDice(testName, speaker, modifier, difficulty);
}

function standartTest(testName, speaker, data) {
  const modifier = data.modifier;
  const difficulty = data.customDifficulty;
  rollDice(testName, speaker, modifier, difficulty);
}

async function rollDice(testName, speaker, modifier, difficulty, stress, infirmity) {
  try {
    const roll = new Roll("2d6+@modifier", { modifier });
    const infirmityRoll = infirmity ? new Roll(`${infirmity}d6`) : null;
    await Promise.all([roll.evaluate({ async: true }), infirmityRoll?.evaluate({ async: true })]);

    const dice = roll.terms[0].results.map((result) => result.result);
    const infirmityDice = infirmityRoll ? infirmityRoll.terms[0].results.map((result) => result.result) : null;

    const excludedValues = infirmityDice ? new Set(infirmityDice) : null;
    const total = dice.reduce((sum, value) => {
      if (excludedValues && excludedValues.has(value)) {
        return sum;
      }
      return sum + value;
    }, 0);

    const fainting = total === 0;
    const success = total >= difficulty;
    const panic = stress >= 7 && stress > total;

    const renderData = { testName, modifier, dice, infirmityDice, total, difficulty, success, panic, fainting };
    await renderAndSendRollResult(speaker, renderData);
  } catch (error) {
    console.error("Error performing roll:", error);
  }
}


async function damageTest(testName, speaker, data) {
  try {
    const damage = data.damage;
    const modifier = parseInt(data.modifier, 10);

    if (damage !== "2") {
      const roll = new Roll("@damage+@modifier", { damage, modifier });
      await roll.evaluate({ async: true });
      const dice = [roll.dice[0].results[0].result, roll.dice[0].results[1].result];
      const total = roll.total;
      const renderData = { testName, modifier, dice, total };
      await renderAndSendRollResult(speaker, renderData, roll);
    } else {
      const total = 2 + modifier;
      const renderData = { testName, modifier, total };
      await renderAndSendRollResult(speaker, renderData);
    }
  } catch (error) {
    console.error("Error in damageTest:", error);
  }
}

async function renderAndSendRollResult(speaker, renderData, roll) {
  try {
    const chatMessage = await renderTemplate("systems/archetericalite/templates/apps/rollResult.hbs", renderData);
    const chatData = {
      speaker: speaker,
      content: chatMessage,
      sound: CONFIG.sounds.dice,
      isRoll: true,
    };
    ChatMessage.create(chatData);
  } catch (error) {
    console.error("Error rendering and sending roll result:", error);
  }
}
