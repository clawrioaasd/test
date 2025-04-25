import ToggleSwitch from './components/toggleSwitch';
import TextBox from './components/textBox';
import SliderField from './components/sliderField';
import TabSystem from './components/tab';

const SPACING = {
    PADDING: 10
};

class HypeGUI {
    constructor() {
        this.gui = new Gui();

        this.width = 400; 
        this.height = 280; 
        this.open = false;

        this.autoRestModule = null;
        this.sprintModule = null;
        this.nplModule = null;
        this.pigeonFixModule = null;
        this.killTimeModule = null;

        this.components = {
            toggles: {},
            textBoxes: {},
            sliderFields: {},
            tabSystem: null
        };

        this.tabs = [
            { id: 'general', label: 'General' },
            { id: 'misc', label: 'Misc' },
            { id: 'npl', label: 'NPL' }
        ];

        this.activeTab = 'general';
        this.activeSlider = null; 

        this.scroll = {
            general: 0,
            misc: 0,
            npl: 0
        };

        this.maxScroll = {
            general: 0,
            misc: 0,
            npl: 0
        };

        this.scrollbarWidth = 6;
        this.isScrolling = false;
        this.scrollStartY = 0;
        this.scrollStartPos = 0;

        this.x = (Renderer.screen.getWidth() - this.width) / 2;
        this.y = (Renderer.screen.getHeight() - this.height) / 2;

        this.lastError = null;
        this.debugEnabled = false;

        this.registerHandlers();

        console.log("HypeGUI constructed");
    }

    drawCustomText(text, x, y, color = Renderer.WHITE) {
        new Text(text)
            .setX(x)
            .setY(y)
            .setColor(color)
            .setShadow(true)
            .setScale(0.9) 
            .draw();
    }

    setModules(autoRestModule, sprintModule, nplModule, pigeonFixModule, killTimeModule) {
        try {
            console.log("Setting modules:", autoRestModule, sprintModule, nplModule, pigeonFixModule, killTimeModule);
            this.autoRestModule = autoRestModule;
            this.sprintModule = sprintModule;
            this.nplModule = nplModule;
            this.pigeonFixModule = pigeonFixModule;
            this.killTimeModule = killTimeModule;

            if (autoRestModule && sprintModule && nplModule && pigeonFixModule && killTimeModule) {
                console.log("Modules set successfully");
            } else {
                console.log("Some modules are null/undefined:", autoRestModule, sprintModule, nplModule, pigeonFixModule, killTimeModule);
                ChatLib.chat("&c[HypeUI] Warning: Some modules were not set correctly");
            }

            this.initComponents();
        } catch (e) {
            console.error("Error setting modules:", e);
        }
    }

    initComponents() {
        try {
            console.log("Initializing components");

            const previousActiveTab = this.activeTab;

            this.components.toggles = {
                general: [],
                misc: [],
                npl: []
            };
            this.components.textBoxes = {
                general: [],
                misc: [],
                npl: []
            };
            this.components.sliderFields = {
                general: [],
                misc: [],
                npl: []
            };

            this.components.tabSystem = new TabSystem(
                this.tabs,
                this.x + SPACING.PADDING,
                this.y + 40,
                this.width - (SPACING.PADDING * 2),
                (tabId) => {
                    this.activeTab = tabId;
                    if (this.debugEnabled) {
                        ChatLib.chat("&a[HypeUI] Tab changed to: " + tabId);
                    }
                }
            );

            this.components.tabSystem.setActiveTab(previousActiveTab);
            this.activeTab = previousActiveTab;

            let autoRestSettings = {};
            let sprintSettings = {};
            let nplSettings = {};
            let pigeonFixSettings = {};
            let killTimeSettings = {};

            try {
                if (this.autoRestModule && this.autoRestModule.getSettings) 
                    autoRestSettings = this.autoRestModule.getSettings();
                if (this.sprintModule && this.sprintModule.getSettings) 
                    sprintSettings = this.sprintModule.getSettings();
                if (this.nplModule && this.nplModule.getSettings) 
                    nplSettings = this.nplModule.getSettings();
                if (this.pigeonFixModule && this.pigeonFixModule.getSettings)
                    pigeonFixSettings = this.pigeonFixModule.getSettings();
                if (this.killTimeModule && this.killTimeModule.getSettings)
                    killTimeSettings = this.killTimeModule.getSettings();
                console.log("Retrieved settings:", autoRestSettings, sprintSettings, nplSettings, pigeonFixSettings, killTimeSettings);
            } catch (e) {
                console.error("Error getting settings:", e);
            }

            const tabInfo = this.components.tabSystem.getContentAreaInfo();
            const startX = this.x + SPACING.PADDING + 10;
            const startY = tabInfo.y + 20; 
            const rowHeight = 20; 

            try {

                this.components.toggles.general.push(
                    new ToggleSwitch(
                        "Enable Kill Time", 
                        killTimeSettings.enabled || false, 
                        startX, 
                        startY,
                        (enabled) => {
                            if (this.killTimeModule && this.killTimeModule.setSetting) {
                                this.killTimeModule.setSetting("enabled", enabled);

                                if (enabled && this.killTimeModule.startKillTimer) {
                                    this.killTimeModule.startKillTimer();
                                } else if (!enabled && this.killTimeModule.stopKillTimer) {
                                    this.killTimeModule.stopKillTimer();
                                }
                            }
                        }
                    )
                );

                this.components.sliderFields.general.push(
                    new SliderField(
                        "Min Time (minutes):", 
                        killTimeSettings.minTime || 240,
                        60, 480, 
                        startX, 
                        startY + rowHeight * 1.5,
                        (value) => {
                            if (this.killTimeModule && this.killTimeModule.setSetting) {
                                this.killTimeModule.setSetting("minTime", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.general.push(
                    new SliderField(
                        "Max Time (minutes):", 
                        killTimeSettings.maxTime || 390,
                        120, 600, 
                        startX, 
                        startY + rowHeight * 2.5,
                        (value) => {
                            if (this.killTimeModule && this.killTimeModule.setSetting) {
                                this.killTimeModule.setSetting("maxTime", value);
                            }
                        },
                        0 
                    )
                );

                const contentHeight = startY + rowHeight * 4;
                const visibleHeight = this.height - (tabInfo.y - this.y) - SPACING.PADDING - (startY - tabInfo.y);
                this.maxScroll.general = Math.max(0, contentHeight - visibleHeight);

                console.log("Added general tab components:", 
                    this.components.toggles.general.length, "toggles,",
                    this.components.sliderFields.general.length, "sliders",
                    "maxScroll:", this.maxScroll.general
                );
            } catch (e) {
                console.error("Error adding general tab toggles:", e);
            }

            try {
                const miscY = startY;

                this.components.toggles.misc.push(
                    new ToggleSwitch(
                        "Enable Auto Sprint", 
                        sprintSettings.enabled || false, 
                        startX, 
                        miscY,
                        (enabled) => {
                            if (this.sprintModule && this.sprintModule.setSetting) {
                                this.sprintModule.setSetting("enabled", enabled);
                            }
                        }
                    )
                );

                this.components.toggles.misc.push(
                    new ToggleSwitch(
                        "Pidgeon Fix", 
                        pigeonFixSettings.enabled || false, 
                        startX, 
                        miscY,
                        (enabled) => {
                            if (this.pigeonFixModule && this.pigeonFixModule.setSetting) {
                                this.pigeonFixModule.setSetting("enabled", enabled);
                            }
                        }
                    )
                );

                const autoRestSectionY = miscY + rowHeight * 2.5;

                this.components.toggles.misc.push(
                    new ToggleSwitch(
                        "Enable Auto Rest", 
                        autoRestSettings.enabled || false, 
                        startX, 
                        autoRestSectionY + rowHeight,
                        (enabled) => {
                            if (this.autoRestModule && this.autoRestModule.setSetting) {
                                this.autoRestModule.setSetting("enabled", enabled);
                            }
                        }
                    )
                );

                this.components.sliderFields.misc.push(
                    new SliderField(
                        "Play Min Time (minutes):", 
                        autoRestSettings.playMinTime || 60,
                        10, 120, 
                        startX, 
                        autoRestSectionY + rowHeight * 2,
                        (value) => {
                            if (this.autoRestModule && this.autoRestModule.setSetting) {
                                this.autoRestModule.setSetting("playMinTime", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.misc.push(
                    new SliderField(
                        "Play Max Time (minutes):", 
                        autoRestSettings.playMaxTime || 120,
                        30, 240, 
                        startX, 
                        autoRestSectionY + rowHeight * 3,
                        (value) => {
                            if (this.autoRestModule && this.autoRestModule.setSetting) {
                                this.autoRestModule.setSetting("playMaxTime", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.misc.push(
                    new SliderField(
                        "Rest Min Time (minutes):", 
                        autoRestSettings.restMinTime || 23,
                        5, 60, 
                        startX, 
                        autoRestSectionY + rowHeight * 4,
                        (value) => {
                            if (this.autoRestModule && this.autoRestModule.setSetting) {
                                this.autoRestModule.setSetting("restMinTime", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.misc.push(
                    new SliderField(
                        "Rest Max Time (minutes):", 
                        autoRestSettings.restMaxTime || 46,
                        10, 120, 
                        startX, 
                        autoRestSectionY + rowHeight * 5,
                        (value) => {
                            if (this.autoRestModule && this.autoRestModule.setSetting) {
                                this.autoRestModule.setSetting("restMaxTime", value);
                            }
                        },
                        0 
                    )
                );

                const contentHeight = autoRestSectionY + rowHeight * 7.5 - miscY;
                const visibleHeight = this.height - (tabInfo.y - this.y) - SPACING.PADDING - (startY - tabInfo.y);
                this.maxScroll.misc = Math.max(0, contentHeight - visibleHeight);

                console.log("Added misc tab components:", 
                    this.components.toggles.misc.length, "toggles,",
                    this.components.sliderFields.misc.length, "sliders",
                    "maxScroll:", this.maxScroll.misc
                );
            } catch (e) {
                console.error("Error adding misc tab components:", e);
            }

            try {
                const nplY = startY;

                this.components.toggles.npl.push(
                    new ToggleSwitch(
                        "Enable NPL Protection", 
                        nplSettings.enabled || false, 
                        startX, 
                        nplY,
                        (enabled) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("enabled", enabled);
                            }
                        }
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "Safe Distance:", 
                        nplSettings.safeDistance || 4.0,
                        1.0, 10.0, 
                        startX, 
                        nplY + rowHeight * 2,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("safeDistance", value);
                            }
                        },
                        1 
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "Detection Radius:", 
                        nplSettings.detectionRadius || 2.0,
                        0.5, 5.0, 
                        startX, 
                        nplY + rowHeight * 3,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("detectionRadius", value);
                            }
                        },
                        1 
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "NPC Proximity:", 
                        nplSettings.npcProximity || 10.0,
                        2.0, 20.0, 
                        startX, 
                        nplY + rowHeight * 4,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("npcProximity", value);
                            }
                        },
                        1 
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "Cooldown (ms):", 
                        nplSettings.cooldownMs || 1000,
                        100, 5000, 
                        startX, 
                        nplY + rowHeight * 5,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("cooldownMs", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "Action Delay (ms):", 
                        nplSettings.actionDelayMs || 5000,
                        1000, 10000, 
                        startX, 
                        nplY + rowHeight * 6,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("actionDelayMs", value);
                            }
                        },
                        0 
                    )
                );

                this.components.sliderFields.npl.push(
                    new SliderField(
                        "Cache Expiry (min):", 
                        nplSettings.cacheExpiryMin || 10,
                        1, 60, 
                        startX, 
                        nplY + rowHeight * 7,
                        (value) => {
                            if (this.nplModule && this.nplModule.setSetting) {
                                this.nplModule.setSetting("cacheExpiryMin", value);
                            }
                        },
                        0 
                    )
                );

                const contentHeight = nplY + rowHeight * 8 - nplY;
                const visibleHeight = this.height - (tabInfo.y - this.y) - SPACING.PADDING - (startY - tabInfo.y);
                this.maxScroll.npl = Math.max(0, contentHeight - visibleHeight);

                console.log("Added NPL components:", 
                    this.components.toggles.npl.length, "toggles,",
                    this.components.sliderFields.npl.length, "sliders",
                    "maxScroll:", this.maxScroll.npl
                );
            } catch (e) {
                console.error("Error adding NPL components:", e);
            }

            this.updateComponentPositions();

        } catch (e) {
            console.error("Error initializing components:", e);
        }
    }

    updateComponentPositions() {
        try {
            if (!this.components) {
                console.error("Components object is null");
                return;
            }

            if (this.components.tabSystem) {
                this.components.tabSystem.x = this.x + SPACING.PADDING;
                this.components.tabSystem.y = this.y + 40;
            } else {
                console.error("Tab system is null");
                return;
            }

            const tabInfo = this.components.tabSystem.getContentAreaInfo();
            const startX = this.x + SPACING.PADDING + 10;
            const startY = tabInfo.y + 20; 
            const rowHeight = 20; 

            if (this.components.toggles && this.components.toggles.general) {
                this.components.toggles.general.forEach((toggle, index) => {
                    if (toggle) {
                        toggle.x = startX;
                        toggle.y = startY + index * rowHeight;
                    }
                });
            }

            if (this.components.sliderFields && this.components.sliderFields.general) {
                this.components.sliderFields.general.forEach((slider, index) => {
                    if (slider) {
                        slider.x = startX;
                        slider.y = startY + rowHeight * (1.5 + index);
                    }
                });
            }

            if (this.components.textBoxes && this.components.textBoxes.general) {
                this.components.textBoxes.general.forEach((textBox, index) => {
                    if (textBox) {
                        textBox.x = startX;
                        textBox.y = startY + rowHeight * (index + 4);
                    }
                });
            }

            if (this.components.toggles && this.components.toggles.misc) {
                this.components.toggles.misc.forEach((toggle, index) => {
                    if (toggle) {
                        toggle.x = startX;
                        if (index === 0) {
                            toggle.y = startY;
                        } else if (index === 1) {
                            toggle.y = startY + rowHeight * 0.5;
                        } else {
                            const autoRestSectionY = startY + rowHeight * 2.5;
                            toggle.y = autoRestSectionY + rowHeight;
                        }
                    }
                });
            }

            if (this.components.sliderFields && this.components.sliderFields.misc) {
                const autoRestSectionY = startY + rowHeight * 2.5;
                this.components.sliderFields.misc.forEach((slider, index) => {
                    if (slider) {
                        slider.x = startX;
                        slider.y = autoRestSectionY + rowHeight * (index + 2);
                    }
                });
            }

            if (this.components.textBoxes && this.components.textBoxes.misc) {
                const autoRestSectionY = startY + rowHeight * 2.5;
                this.components.textBoxes.misc.forEach((textBox, index) => {
                    if (textBox) {
                        textBox.x = startX;
                        textBox.y = autoRestSectionY + rowHeight * (index + 6); 
                    }
                });
            }

            if (this.components.toggles && this.components.toggles.npl) {
                this.components.toggles.npl.forEach((toggle, index) => {
                    if (toggle) {
                        toggle.x = startX;
                        toggle.y = startY + index * rowHeight;
                    }
                });
            }

            if (this.components.sliderFields && this.components.sliderFields.npl) {
                this.components.sliderFields.npl.forEach((slider, index) => {
                    if (slider) {
                        slider.x = startX;
                        slider.y = startY + rowHeight * (index + 2);
                    }
                });
            }

            if (this.components.textBoxes && this.components.textBoxes.npl) {
                this.components.textBoxes.npl.forEach((textBox, index) => {
                    if (textBox) {
                        textBox.x = startX;
                        textBox.y = startY + rowHeight * (index + 9); 
                    }
                });
            }

            if (this.debugEnabled) {
                console.log("Component positions updated at:", this.x, this.y);
            }
        } catch (e) {
            console.error("Error updating component positions:", e);
            this.lastError = "Position update error: " + e.toString();
        }
    }

    registerHandlers() {
        try {
            this.gui.registerDraw((mouseX, mouseY, partialTicks) => {
                this.draw(mouseX, mouseY, partialTicks);
            });

            this.gui.registerClicked((mouseX, mouseY, button) => {
                this.handleClick(mouseX, mouseY, button);
            });

            this.gui.registerMouseDragged((mouseX, mouseY, button) => {
                this.handleMouseDrag(mouseX, mouseY, button);
            });

            this.gui.registerMouseReleased((mouseX, mouseY, button) => {
                this.handleMouseRelease(mouseX, mouseY, button);
            });

            this.gui.registerScrolled((mouseX, mouseY, direction) => {
                try {
                    if (this.isMouseInContentArea(mouseX, mouseY) && this.activeTab && this.maxScroll[this.activeTab] > 0) {
                        const scrollAmount = direction > 0 ? -10 : 10;

                        this.scroll[this.activeTab] = Math.max(
                            0, 
                            Math.min(
                                this.maxScroll[this.activeTab], 
                                this.scroll[this.activeTab] + scrollAmount
                            )
                        );

                        if (this.debugEnabled) {
                            console.log(
                                "Scrolled tab:", this.activeTab, 
                                "amount:", scrollAmount, 
                                "position:", this.scroll[this.activeTab],
                                "max:", this.maxScroll[this.activeTab]
                            );
                        }
                        return true;
                    }
                    return false;
                } catch (e) {
                    console.error("Mouse scroll error:", e);
                    return false;
                }
            });

            this.gui.registerKeyTyped((typedChar, keyCode) => {
                this.handleKeyTyped(typedChar, keyCode);
            });

            console.log("GUI handlers registered");
        } catch (e) {
            console.error("Error registering GUI handlers:", e);
        }
    }

    draw(mouseX, mouseY, partialTicks) {
        try {
            Renderer.drawRect(
                Renderer.color(30, 30, 40, 255), 
                this.x, 
                this.y, 
                this.width, 
                this.height
            );

            const borderColor = Renderer.color(0, 220, 220, 255); 
            const borderThickness = 2;

            Renderer.drawRect(
                borderColor,
                this.x - borderThickness,
                this.y - borderThickness,
                this.width + borderThickness * 2,
                borderThickness
            );

            Renderer.drawRect(
                borderColor,
                this.x - borderThickness,
                this.y + this.height,
                this.width + borderThickness * 2,
                borderThickness
            );

            Renderer.drawRect(
                borderColor,
                this.x - borderThickness,
                this.y,
                borderThickness,
                this.height
            );

            Renderer.drawRect(
                borderColor,
                this.x + this.width,
                this.y,
                borderThickness,
                this.height
            );

            Renderer.drawRect(
                Renderer.color(0, 150, 150, 255), 
                this.x, 
                this.y, 
                this.width, 
                30
            );

            this.drawCustomText(
                "HypeUI Settings", 
                this.x + this.width / 2 - Renderer.getStringWidth("HypeUI Settings") / 2, 
                this.y + 10,
                Renderer.WHITE
            );

            const closeX = this.x + this.width - 20;
            const closeY = this.y + 8;
            const closeHovered = mouseX >= closeX - 5 && mouseX <= closeX + 15 && mouseY >= closeY - 5 && mouseY <= closeY + 15;

            if (closeHovered) {
                this.drawCustomText("X", closeX, closeY, Renderer.color(255, 100, 100, 255));
            } else {
                this.drawCustomText("X", closeX, closeY, Renderer.WHITE);
            }

            if (this.components.tabSystem) {
                this.components.tabSystem.draw();
            }

            const tabInfo = this.components.tabSystem ? 
                this.components.tabSystem.getContentAreaInfo() : 
                { x: this.x, y: this.y + 40, width: this.width };

            if (this.activeTab) {
                Renderer.drawRect(
                    Renderer.color(35, 35, 45, 200), 
                    tabInfo.x,
                    tabInfo.y,
                    tabInfo.width,
                    this.height - (tabInfo.y - this.y) - SPACING.PADDING
                );

                const activeTabLabel = this.tabs.find(tab => tab.id === this.activeTab)?.label || "";
                const tabTitleX = tabInfo.x + SPACING.PADDING;
                const tabTitleY = tabInfo.y + 6;

                this.drawCustomText(
                    activeTabLabel + " Settings", 
                    tabTitleX, 
                    tabTitleY,
                    Renderer.color(0, 255, 255, 255)
                );

                Renderer.drawLine(
                    Renderer.color(0, 200, 200, 255),
                    tabInfo.x + SPACING.PADDING,
                    tabTitleY + 10,
                    tabInfo.x + tabInfo.width - SPACING.PADDING,
                    tabTitleY + 10,
                    1
                );

                const contentX = tabInfo.x;
                const contentY = tabInfo.y + 20; 
                const contentWidth = tabInfo.width;
                const contentHeight = this.height - (contentY - this.y) - SPACING.PADDING;

                const visibleMinY = contentY;
                const visibleMaxY = contentY + contentHeight;

                if (this.activeTab === 'misc') {
                    const rowHeight = 20;
                    const startX = this.x + SPACING.PADDING + 10;
                    const startY = tabInfo.y + 20;
                    const autoRestHeaderY = startY + rowHeight * 2.5 - this.scroll.misc;

                    if (autoRestHeaderY >= visibleMinY && autoRestHeaderY <= visibleMaxY) {
                        this.drawCustomText(
                            "Auto Rest Settings", 
                            startX, 
                            autoRestHeaderY - 10,
                            Renderer.color(0, 200, 200, 255)
                        );

                        Renderer.drawLine(
                            Renderer.color(0, 180, 180, 200),
                            startX,
                            autoRestHeaderY,
                            startX + 180,
                            autoRestHeaderY,
                            1
                        );
                    }
                }

                if (this.activeTab === 'general') {
                    const rowHeight = 20;
                    const startX = this.x + SPACING.PADDING + 10;
                    const startY = tabInfo.y + 20;
                    const killTimeHeaderY = startY - 10 - this.scroll.general;

                    if (killTimeHeaderY >= visibleMinY && killTimeHeaderY <= visibleMaxY) {
                        this.drawCustomText(
                            "Kill Time Settings", 
                            startX, 
                            killTimeHeaderY,
                            Renderer.color(0, 200, 200, 255)
                        );

                        Renderer.drawLine(
                            Renderer.color(0, 180, 180, 200),
                            startX,
                            killTimeHeaderY + 10,
                            startX + 180,
                            killTimeHeaderY + 10,
                            1
                        );
                    }
                }

                if (this.components.toggles[this.activeTab]) {
                    this.components.toggles[this.activeTab].forEach(toggle => {
                        if (toggle && typeof toggle.draw === 'function') {
                            const originalY = toggle.y;
                            toggle.y -= this.scroll[this.activeTab];

                            if (toggle.y >= visibleMinY && toggle.y <= visibleMaxY) {
                                toggle.draw();
                            }

                            toggle.y = originalY;
                        }
                    });
                }

                if (this.components.textBoxes[this.activeTab]) {
                    this.components.textBoxes[this.activeTab].forEach(textBox => {
                        if (textBox && typeof textBox.draw === 'function') {
                            const originalY = textBox.y;
                            textBox.y -= this.scroll[this.activeTab];

                            if (textBox.y >= visibleMinY && textBox.y <= visibleMaxY) {
                                textBox.draw();
                            }

                            textBox.y = originalY;
                        }
                    });
                }

                if (this.components.sliderFields[this.activeTab]) {
                    this.components.sliderFields[this.activeTab].forEach(sliderField => {
                        if (sliderField && typeof sliderField.draw === 'function') {
                            const originalY = sliderField.y;
                            sliderField.y -= this.scroll[this.activeTab];

                            if (sliderField.y >= visibleMinY && sliderField.y <= visibleMaxY) {
                                sliderField.draw();
                            }

                            sliderField.y = originalY;
                        }
                    });
                }

                if (this.maxScroll[this.activeTab] > 0) {
                    const scrollbarX = tabInfo.x + tabInfo.width - this.scrollbarWidth - 2;
                    const scrollbarY = contentY;
                    const scrollbarHeight = contentHeight;

                    Renderer.drawRect(
                        Renderer.color(30, 30, 30, 180),
                        scrollbarX,
                        scrollbarY,
                        this.scrollbarWidth,
                        scrollbarHeight
                    );

                    const thumbRatio = Math.min(1, scrollbarHeight / (scrollbarHeight + this.maxScroll[this.activeTab]));
                    const thumbHeight = Math.max(20, scrollbarHeight * thumbRatio);
                    const scrollProgress = this.scroll[this.activeTab] / this.maxScroll[this.activeTab];
                    const thumbY = scrollbarY + scrollProgress * (scrollbarHeight - thumbHeight);

                    Renderer.drawRect(
                        this.isScrolling ? Renderer.color(0, 220, 220, 255) : Renderer.color(0, 180, 180, 200),
                        scrollbarX,
                        thumbY,
                        this.scrollbarWidth,
                        thumbHeight
                    );
                }
            }

            if (this.lastError) {
                this.drawCustomText(
                    "Error: " + this.lastError, 
                    this.x + 100, 
                    this.y + this.height - 15,
                    Renderer.RED
                );
            }

            if (this.debugEnabled) {
                this.drawCustomText(
                    "Debug: Active Tab = " + this.activeTab + ", Scroll = " + this.scroll[this.activeTab].toFixed(1), 
                    this.x + 10, 
                    this.y + this.height - 15,
                    Renderer.color(150, 150, 150, 255)
                );
            }

        } catch (e) {
            console.error("GUI drawing error:", e);
            this.lastError = e.toString();

            try {
                Renderer.drawRect(
                    Renderer.color(30, 30, 30, 255),
                    100, 100, 300, 100
                );

                new Text("HypeUI Error", 150, 110)
                    .setColor(Renderer.RED)
                    .draw();

                new Text("Error: " + e, 120, 130)
                    .setColor(Renderer.WHITE)
                    .draw();
            } catch (e2) {
                ChatLib.chat("&c[HypeUI] Critical rendering error: " + e);
            }
        }
    }

    isMouseInContentArea(mouseX, mouseY) {
        try {
            if (!this.components || !this.components.tabSystem) return false;

            const tabInfo = this.components.tabSystem.getContentAreaInfo();
            const contentY = tabInfo.y + 20; 
            const contentHeight = this.height - (contentY - this.y) - SPACING.PADDING;

            const scrollbarX = tabInfo.x + tabInfo.width - this.scrollbarWidth - 2;

            return mouseX >= tabInfo.x && 
                   mouseX <= scrollbarX && 
                   mouseY >= contentY && 
                   mouseY <= contentY + contentHeight;
        } catch (e) {
            console.error("Error checking if mouse is in content area:", e);
            return false;
        }
    }

    isMouseOverScrollbar(mouseX, mouseY) {
        if (this.maxScroll[this.activeTab] <= 0) return false;

        if (!this.components.tabSystem) return false;

        const tabInfo = this.components.tabSystem.getContentAreaInfo();
        const contentY = tabInfo.y + 20; 
        const scrollbarX = tabInfo.x + tabInfo.width - this.scrollbarWidth - 2;
        const scrollbarHeight = this.height - (contentY - this.y) - SPACING.PADDING;

        return mouseX >= scrollbarX && 
               mouseX <= scrollbarX + this.scrollbarWidth && 
               mouseY >= contentY && 
               mouseY <= contentY + scrollbarHeight;
    }

    handleClick(mouseX, mouseY, button) {
        try {
            const closeX = this.x + this.width - 20;
            const closeY = this.y + 8;
            if (mouseX >= closeX - 5 && mouseX <= closeX + 15 && mouseY >= closeY - 5 && mouseY <= closeY + 15) {
                this.close();
                return;
            }

            if (this.isMouseOverScrollbar(mouseX, mouseY)) {
                this.isScrolling = true;
                this.scrollStartY = mouseY;
                this.scrollStartPos = this.scroll[this.activeTab];
                return;
            }

            if (this.components.tabSystem && this.components.tabSystem.handleClick(mouseX, mouseY)) {
                this.activeTab = this.components.tabSystem.getActiveTabId();
                return;
            }

            if (this.activeTab) {
                let handled = false;

                if (this.components.toggles[this.activeTab]) {
                    for (const toggle of this.components.toggles[this.activeTab]) {
                        if (toggle && typeof toggle.handleClick === 'function') {
                            const originalY = toggle.y;
                            toggle.y -= this.scroll[this.activeTab];

                            const clickResult = toggle.handleClick(mouseX, mouseY);

                            toggle.y = originalY;

                            if (clickResult) {
                                handled = true;
                                break;
                            }
                        }
                    }
                }

                if (!handled && this.components.textBoxes[this.activeTab]) {
                    for (const textBox of this.components.textBoxes[this.activeTab]) {
                        if (textBox && typeof textBox.handleClick === 'function') {
                            const originalY = textBox.y;
                            textBox.y -= this.scroll[this.activeTab];

                            const clickResult = textBox.handleClick(mouseX, mouseY);

                            textBox.y = originalY;

                            if (clickResult) {
                                handled = true;
                                break;
                            }
                        }
                    }
                }

                if (!handled && this.components.sliderFields[this.activeTab]) {
                    for (const sliderField of this.components.sliderFields[this.activeTab]) {
                        if (sliderField && typeof sliderField.handleClick === 'function') {
                            const originalY = sliderField.y;
                            sliderField.y -= this.scroll[this.activeTab];

                            const clickResult = sliderField.handleClick(mouseX, mouseY);

                            if (clickResult && sliderField.slider && sliderField.slider.dragging) {
                                this.activeSlider = sliderField.slider;
                            }

                            sliderField.y = originalY;

                            if (clickResult) {
                                handled = true;
                                break;
                            }
                        }
                    }
                }
            }

        } catch (e) {
            console.error("Click handling error:", e);
            this.lastError = e.toString();
        }
    }

    handleMouseDrag(mouseX, mouseY, button) {
        try {
            if (this.isScrolling && this.activeTab && this.maxScroll[this.activeTab] > 0) {
                if (!this.components.tabSystem) return;

                const tabInfo = this.components.tabSystem.getContentAreaInfo();
                const contentY = tabInfo.y + 20; 
                const contentHeight = this.height - (contentY - this.y) - SPACING.PADDING;

                const thumbRatio = Math.min(1, contentHeight / (contentHeight + this.maxScroll[this.activeTab]));
                const thumbHeight = Math.max(20, contentHeight * thumbRatio);
                const availableTrackHeight = contentHeight - thumbHeight;

                const dragRatio = this.maxScroll[this.activeTab] / availableTrackHeight;

                const dragDistance = mouseY - this.scrollStartY;
                this.scroll[this.activeTab] = Math.max(
                    0, 
                    Math.min(
                        this.maxScroll[this.activeTab], 
                        this.scrollStartPos + dragDistance * dragRatio
                    )
                );
            }

            if (this.activeSlider && this.activeTab && 
                this.components && this.components.sliderFields && 
                this.components.sliderFields[this.activeTab]) {

                const sliderFields = this.components.sliderFields[this.activeTab];
                if (Array.isArray(sliderFields)) {
                    for (const sliderField of sliderFields) {
                        if (sliderField && sliderField.slider === this.activeSlider) {
                            const originalY = sliderField.y;
                            sliderField.y -= this.scroll[this.activeTab];

                            sliderField.handleMouseMove(mouseX, mouseY);

                            sliderField.y = originalY;
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Drag handling error:", e);
            this.lastError = e.toString();
        }
    }

    handleMouseRelease(mouseX, mouseY, button) {
        try {
            this.isScrolling = false;

            if (this.activeSlider) {
                this.activeSlider = null;
            }

            if (this.components && this.components.sliderFields) {
                for (const tabId in this.components.sliderFields) {
                    const sliderFields = this.components.sliderFields[tabId];

                    if (sliderFields && Array.isArray(sliderFields)) {
                        for (const sliderField of sliderFields) {
                            if (sliderField && typeof sliderField.handleMouseRelease === 'function') {
                                sliderField.handleMouseRelease(mouseX, mouseY);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Mouse release error:", e);
            this.lastError = e.toString();
        }
    }

    handleMouseMove(mouseX, mouseY) {
        try {
            if (this.components.tabSystem && typeof this.components.tabSystem.handleMouseMove === 'function') {
                this.components.tabSystem.handleMouseMove(mouseX, mouseY);
            }

            if (this.activeTab) {
                if (this.components.toggles[this.activeTab]) {
                    this.components.toggles[this.activeTab].forEach(toggle => {
                        if (toggle && typeof toggle.handleMouseMove === 'function') {
                            const originalY = toggle.y;
                            toggle.y -= this.scroll[this.activeTab];

                            toggle.handleMouseMove(mouseX, mouseY);

                            toggle.y = originalY;
                        }
                    });
                }

                if (this.components.textBoxes[this.activeTab]) {
                    this.components.textBoxes[this.activeTab].forEach(textBox => {
                        if (textBox && typeof textBox.handleMouseMove === 'function') {
                            const originalY = textBox.y;
                            textBox.y -= this.scroll[this.activeTab];

                            textBox.handleMouseMove(mouseX, mouseY);

                            textBox.y = originalY;
                        }
                    });
                }

                if (this.components.sliderFields[this.activeTab]) {
                    this.components.sliderFields[this.activeTab].forEach(sliderField => {
                        if (sliderField && typeof sliderField.handleMouseMove === 'function') {
                            const originalY = sliderField.y;
                            sliderField.y -= this.scroll[this.activeTab];

                            if (this.activeSlider === null || sliderField.slider === this.activeSlider) {
                                sliderField.handleMouseMove(mouseX, mouseY);
                            }

                            sliderField.y = originalY;
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Mouse move handling error:", e);
            this.lastError = e.toString();
        }
    }

    handleKeyTyped(typedChar, keyCode) {
        try {
            if (keyCode === 1) {
                this.close();
                return true;
            }

            if (this.activeTab && this.components.textBoxes[this.activeTab]) {
                for (const textBox of this.components.textBoxes[this.activeTab]) {
                    if (textBox && typeof textBox.handleKeyTyped === 'function') {
                        const originalY = textBox.y;
                        textBox.y -= this.scroll[this.activeTab];

                        const keyResult = textBox.handleKeyTyped(typedChar, keyCode);

                        textBox.y = originalY;

                        if (keyResult) {
                            return true;
                        }
                    }
                }
            }

            if (this.activeTab && this.components.sliderFields[this.activeTab]) {
                for (const sliderField of this.components.sliderFields[this.activeTab]) {
                    if (sliderField && typeof sliderField.handleKeyTyped === 'function') {
                        const originalY = sliderField.y;
                        sliderField.y -= this.scroll[this.activeTab];

                        const keyResult = sliderField.handleKeyTyped(typedChar, keyCode);

                        sliderField.y = originalY;

                        if (keyResult) {
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch (e) {
            console.error("Key typed handling error:", e);
            this.lastError = e.toString();
            return false;
        }
    }

    openGUI() {
        try {

            this.x = (Renderer.screen.getWidth() - this.width) / 2;
            this.y = (Renderer.screen.getHeight() - this.height) / 2;

            this.scroll = {
                general: 0,
                misc: 0,
                npl: 0
            };

            this.initComponents();

            this.updateComponentPositions();

            if (this.debugEnabled) {
                console.log("Opening HypeUI GUI");
                console.log("Window size:", Renderer.screen.getWidth(), "x", Renderer.screen.getHeight());
                console.log("GUI position:", this.x, ",", this.y);
                console.log("Active tab:", this.activeTab);
            }

            this.gui.open();
            this.open = true;

        } catch (e) {
            console.error("Error opening GUI:", e);
            ChatLib.chat("&c[HypeUI] Error opening GUI: " + e);
        }
    }

    close() {
        try {
            this.gui.close();
            this.open = false;

        } catch (e) {
            console.error("Error closing GUI:", e);
        }
    }

    toggle() {
        this.openGUI();
    }

    toggleDebug() {
        this.debugEnabled = !this.debugEnabled;
        ChatLib.chat("&a[HypeUI] Debug mode " + (this.debugEnabled ? "enabled" : "disabled"));
    }

    isOpen() {
        return this.open;
    }

    setActiveTab(tabId) {
        if (this.tabs.some(tab => tab.id === tabId)) {
            this.activeTab = tabId;

            if (this.components.tabSystem) {
                this.components.tabSystem.setActiveTab(tabId);
            }
        }
    }
}

export default HypeGUI;