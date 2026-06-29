import PropTypes from "prop-types";
import clsx from "clsx";
import { useSelector } from "react-redux";
import defaultTextGridData from "../../data/text-grid/text-grid-one.json";
import TextGridOneSingle from "../../components/text-grid/TextGridOneSingle.jsx";

const TextGridOne = ({ spaceBottomClass }) => {
  const { settings } = useSelector(state => state.settings);

  const missionTitle = settings?.missionTitle || "Our Core Mission";
  const missionSubtitle = settings?.missionSubtitle || "We focus on delivering value through three pillars.";

  const gridData = [
    {
      id: "1",
      icon: "fa fa-rocket",
      title: settings?.missionGridCol1Title || defaultTextGridData[0]?.title || "Our Vision",
      text: settings?.missionGridCol1Desc || defaultTextGridData[0]?.text || ""
    },
    {
      id: "2",
      icon: "fa fa-line-chart",
      title: settings?.missionGridCol2Title || defaultTextGridData[1]?.title || "Our Mission",
      text: settings?.missionGridCol2Desc || defaultTextGridData[1]?.text || ""
    },
    {
      id: "3",
      icon: defaultTextGridData[2]?.icon || "fa fa-bullseye",
      title: settings?.missionGridCol3Title || defaultTextGridData[2]?.title || "Our Goal",
      text: settings?.missionGridCol3Desc || defaultTextGridData[2]?.text || ""
    }
  ];

  return (
    <section className={clsx("text-grid-wrapper", spaceBottomClass)}>
      <div className="container">
        {/* Added a Header section for context */}
        <div className="section-title text-center mb-40">
          <h2>{missionTitle}</h2>
          <p>{missionSubtitle}</p>
        </div>
        
        <div className="row g-4"> {/* g-4 adds consistent Bootstrap gutter spacing */}
          {gridData.map((single, key) => (
            <div className="col-lg-4 col-md-6" key={key}>
              <TextGridOneSingle data={single} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

TextGridOne.propTypes = {
  spaceBottomClass: PropTypes.string
};

export default TextGridOne;
