import React from 'react';
import { register } from "../../../data";

import './CharacterSavingThrows.scss';

export default function CharacterSavingThrows() {
    return (
        <div className="check-group character-saving-throws">
            <div className="content">
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="strength-proficiency"
                        className="check-input__checkbox"
                        id="strength-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="strength-saving-throw"
                            name="strength-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="strength-saving-throw"
                        className="check-input__text"
                    >
                        Strength
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="dexterity-proficiency"
                        className="check-input__checkbox"
                        id="dexterity-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="dexterity-saving-throw"
                            name="dexterity-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="dexterity-saving-throw"
                        className="check-input__text"
                    >
                        Dexterity
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="constitution-proficiency"
                        className="check-input__checkbox"
                        id="constitution-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="constitution-saving-throw"
                            name="constitution-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="constitution-saving-throw"
                        className="check-input__text"
                    >
                        Constitution
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="intelligence-proficiency"
                        className="check-input__checkbox"
                        id="intelligence-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="intelligence-saving-throw"
                            name="intelligence-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="intelligence-saving-throw"
                        className="check-input__text"
                    >
                        Inteligence
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="wisdom-proficiency"
                        className="check-input__checkbox"
                        id="wisdom-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="wisdom-saving-throw"
                            name="wisdom-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="wisdom-saving-throw"
                        className="check-input__text"
                    >
                        Wisdom
                    </label>
                </span>
                <span className="check-input">
                    <input
                        type="checkbox"
                        name="charisma-proficiency"
                        className="check-input__checkbox"
                        id="charisma-proficiency"
                        ref={(input) => register(input)}
                    />
                    <span className="checkmark"></span>
                    <div className="check-input__input-wrap">
                        <input
                            id="charisma-saving-throw"
                            name="charisma-saving-throw"
                            type="text"
                            className="check-input__input"
                            ref={(input) => register(input)}
                        />
                    </div>
                    <label
                        htmlFor="charisma-saving-throw"
                        className="check-input__text"
                    >
                        Charisma
                    </label>
                </span>
                <label className="check-group__text">Saving Throws</label>
            </div>
        </div>
    )
}
