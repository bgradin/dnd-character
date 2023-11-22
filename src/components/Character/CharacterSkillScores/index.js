import React from 'react';
import { register } from "../../../data";

import './CharacterSkillScores.scss';

export default function CharacterSkillScores() {
    return (
        <div className="check-group character-skill-scores">
            <div className="content">
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="acrobatics-proficiency"
                        className="check-input__checkbox"
                        id="acrobatics-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="acrobatics-score"
                            name="acrobatics-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="acrobatics-score"
                        className="check-input__text"
                    >
                        Acrobatics (Dex)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="animal-handling-proficiency"
                        className="check-input__checkbox"
                        id="animal-handling-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="animal-handling-score"
                            name="animal-handling-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="animal-handling-score"
                        className="check-input__text"
                    >
                        Animal Handling (Wis)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="arcana-proficiency"
                        className="check-input__checkbox"
                        id="arcana-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="arcana-score"
                            name="arcana-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="arcana-score"
                        className="check-input__text"
                    >
                        Arcana (Int)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="athletics-proficiency"
                        className="check-input__checkbox"
                        id="athletics-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="athletics-score"
                            name="athletics-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="athletics-score"
                        className="check-input__text"
                    >
                        Athletics (Str)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="deception-proficiency"
                        className="check-input__checkbox"
                        id="deception-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="deception-score"
                            name="deception-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="deception-score"
                        className="check-input__text"
                    >
                        Deception (Cha)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="history-proficiency"
                        className="check-input__checkbox"
                        id="history-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="history-score"
                            name="history-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="history-score"
                        className="check-input__text"
                    >
                        History (Int)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="insight-proficiency"
                        className="check-input__checkbox"
                        id="insight-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="insight-score"
                            name="insight-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="insight-score"
                        className="check-input__text"
                    >
                        Insight (Wis)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="intimidation-proficiency"
                        className="check-input__checkbox"
                        id="intimidation-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="intimidation-score"
                            name="intimidation-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="intimidation-score"
                        className="check-input__text"
                    >
                        Intimidation (Cha)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="investigation-proficiency"
                        className="check-input__checkbox"
                        id="investigation-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="investigation-score"
                            name="investigation-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="investigation-score"
                        className="check-input__text"
                    >
                        Investigation (Int)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="medicine-proficiency"
                        className="check-input__checkbox"
                        id="medicine-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="medicine-score"
                            name="medicine-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="medicine-score"
                        className="check-input__text"
                    >
                        Medicine (Wis)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="nature-proficiency"
                        className="check-input__checkbox"
                        id="nature-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="nature-score"
                            name="nature-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="nature-score"
                        className="check-input__text"
                    >
                        Nature (Int)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="perception-proficiency"
                        className="check-input__checkbox"
                        id="perception-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="perception-score"
                            name="perception-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="perception-score"
                        className="check-input__text"
                    >
                        Perception (Wis)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="performance-proficiency"
                        className="check-input__checkbox"
                        id="performance-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="performance-score"
                            name="performance-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="performance-score"
                        className="check-input__text"
                    >
                        Performance (Cha)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="persuasion-proficiency"
                        className="check-input__checkbox"
                        id="persuasion-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="persuasion-score"
                            name="persuasion-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="persuasion-score"
                        className="check-input__text"
                    >
                        Persuasion (Cha)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="religion-proficiency"
                        className="check-input__checkbox"
                        id="religion-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="religion-score"
                            name="religion-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="religion-score"
                        className="check-input__text"
                    >
                        Religion (Int)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="sleight-of-hand-proficiency"
                        className="check-input__checkbox"
                        id="sleight-of-hand-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="sleight-of-hand-score"
                            name="sleight-of-hand-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="sleight-of-hand-score"
                        className="check-input__text"
                    >
                        Sleight of Hand (Dex)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="stealth-proficiency"
                        className="check-input__checkbox"
                        id="stealth-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="stealth-score"
                            name="stealth-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="stealth-score"
                        className="check-input__text"
                    >
                        Stealth (Dex)
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="survival-proficiency"
                        className="check-input__checkbox"
                        id="survival-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="survival-score"
                            name="survival-score"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="survival-score"
                        className="check-input__text"
                    >
                        Survival (Wis)
                    </label>
                </span>
                <label className="check-group__text">Skills</label>
            </div>
        </div>
    )
}
