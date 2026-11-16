import armor from "./img/armor.svg";
import bannerBottom from "./img/bannerBottom.svg";
import bannerMiddle from "./img/bannerMiddle.svg";
import bannerTop from "./img/bannerTop.svg";
import box from "./img/box.svg";
import boxLgBottom from "./img/boxLgBottom.svg";
import boxLgMiddle from "./img/boxLgMiddle.svg";
import boxLgTop from "./img/boxLgTop.svg";
import boxMdBottom from "./img/boxMdBottom.svg";
import boxMdMiddle from "./img/boxMdMiddle.svg";
import boxMdTop from "./img/boxMdTop.svg";
import equipmentBottom from "./img/equipmentBottom.svg";
import equipmentGold from "./img/equipmentGold.svg";
import equipmentMiddle from "./img/equipmentMiddle.svg";
import equipmentTop from "./img/equipmentTop.svg";
import fieldsetFrame from "./img/fieldsetFrame.svg";
import fieldsetFrameStraight from "./img/fieldsetFrameStraight.svg";
import headerCharBottom from "./img/headerCharBottom.svg";
import headerCharMiddle from "./img/headerCharMiddle.svg";
import headerCharTop from "./img/headerCharTop.svg";
import headerInfoMobileBottom from "./img/headerInfoMobileBottom.svg";
import headerInfoMobileMiddle from "./img/headerInfoMobileMiddle.svg";
import headerInfoMobileTop from "./img/headerInfoMobileTop.svg";
import hitPointsCurrentBottom from "./img/hitPointsCurrentBottom.svg";
import hitPointsCurrentMiddle from "./img/hitPointsCurrentMiddle.svg";
import hitPointsCurrentTop from "./img/hitPointsCurrentTop.svg";
import hitPointsTempBottom from "./img/hitPointsTempBottom.svg";
import hitPointsTempMiddle from "./img/hitPointsTempMiddle.svg";
import hitPointsTempTop from "./img/hitPointsTempTop.svg";
import inspiration from "./img/inspiration.svg";
import passiveWisdomBody from "./img/passiveWisdomBody.svg";
import proficiencyBonusBody from "./img/proficiencyBonusBody.svg";
import stat from "./img/stat.svg";

const sheetImages = [
  armor,
  bannerBottom,
  bannerMiddle,
  bannerTop,
  box,
  boxLgBottom,
  boxLgMiddle,
  boxLgTop,
  boxMdBottom,
  boxMdMiddle,
  boxMdTop,
  equipmentBottom,
  equipmentGold,
  equipmentMiddle,
  equipmentTop,
  fieldsetFrame,
  fieldsetFrameStraight,
  headerCharBottom,
  headerCharMiddle,
  headerCharTop,
  headerInfoMobileBottom,
  headerInfoMobileMiddle,
  headerInfoMobileTop,
  hitPointsCurrentBottom,
  hitPointsCurrentMiddle,
  hitPointsCurrentTop,
  hitPointsTempBottom,
  hitPointsTempMiddle,
  hitPointsTempTop,
  inspiration,
  passiveWisdomBody,
  proficiencyBonusBody,
  stat,
];
let preloaded = false;

export function preloadSheetAssets() {
  if (preloaded) return;
  preloaded = true;
  sheetImages.forEach(href => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);
  });
}
