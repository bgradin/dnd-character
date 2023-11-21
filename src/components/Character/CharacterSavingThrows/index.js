import React from 'react';
import { register } from "../../../data";

import './CharacterSavingThrows.scss';

export default function CharacterSavingThrows() {
    return (
        <div className="check-group character-saving-throws">
            <span className="check-input">
                <input
                    type="checkbox"
                    name="strength-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="strength-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Strength</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="dexterity-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="dexterity-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Dexterity</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="constitution-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="constitution-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Constitution</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="intelligence-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="intelligence-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Inteligence</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="wisdom-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="wisdom-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Wisdom</span>
            </span>
            <span className="check-input">
                <input
                    type="checkbox"
                    name="charisma-proficiency"
                    className="check-input__checkbox"
                    id=""
                    ref={(input) => register(input)}
                />
                <span className="checkmark"></span>
                <div className="check-input__input-wrap">
                    <input
                        name="charisma-saving-throw"
                        type="text"
                        className="check-input__input"
                        ref={(input) => register(input)}
                    />
                </div>
                <span className="check-input__text">Charisma</span>
            </span>
            <span className="check-group__text">Saving Throws</span>
        </div>
    )
}
