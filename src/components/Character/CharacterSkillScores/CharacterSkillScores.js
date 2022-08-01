import React from 'react';
import { register } from "../../../data";

import './CharacterSkillScores.scss';

export default function CharacterSkillScores() {
    return (
        <div className="check-group character-skill-scores">
            <span className="check-input">
                <input
                    type="checkbox"
                    name="acrobatics-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="acrobatics-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Acrobatics (Dex)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="animal-handling-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="animal-handling-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Animal Handling (Wis)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="arcana-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="arcana-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Arcana (Int)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="athletics-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="athletics-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Athletics (Str)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="deception-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="deception-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Deception (Cha)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="history-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="history-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">History (Int)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="insight-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="insight-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Insight (Wis)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="intimidation-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="intimidation-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Intimidation (Cha)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="investigation-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="investigation-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Investigation (Int)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="medicine-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="medicine-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Medicine (Wis)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="nature-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="nature-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Nature (Int)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="perception-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="perception-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Perception (Wis)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="performance-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="performance-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Performance (Cha)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="persuasion-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="persuasion-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Persuasion (Cha)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="religion-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="religion-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Religion (Int)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="sleight-of-hand-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="sleight-of-hand-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Sleight of Hand (Dex)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="stealth-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="stealth-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Stealth (Dex)</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="survival-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="survival-score"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Survival (Wis)</span>
            </span>
            <span className="check-group__text">Skills</span>
        </div>
    )
}
