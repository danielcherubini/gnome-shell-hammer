// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
/* exported init buildPrefsWidget */

// loosely based on https://gitlab.gnome.org/GNOME/gnome-shell-extensions/-/blob/master/extensions/auto-move-windows/prefs.js

const { Gio, GLib, GObject, Gtk, Pango } = imports.gi;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain('gnome-shell-hammer');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;

const schema_id = 'org.gnome.shell.extensions.gnome-shell-hammer';

const SettingsKey = {
    STARTUP_OVERVIEW: 'startup-overview',
    FOUR_FINGER_SWIPE: 'four-finger-swipe'
};

const ShellHammerSettingListBoxRow = GObject.registerClass({
    Properties: {
        'label': GObject.ParamSpec.string(
            'label', 'Settings Label', 'label',
            GObject.ParamFlags.READWRITE,
            ''),
        'description': GObject.ParamSpec.string(
            'description', 'Settings Description', 'description',
            GObject.ParamFlags.READWRITE,
            ''),
        'settingsKey': GObject.ParamSpec.string(
            'settingsKey', 'Settings Key', 'settingsKey',
            GObject.ParamFlags.READWRITE,
            ''),
        'type': GObject.ParamSpec.string(
            'type', 'Control Type', 'type',
            GObject.ParamFlags.READWRITE,
            'switch'),
        'options': GObject.param_spec_variant(
            'options', 'Options for Control', 'options',
            new GLib.VariantType('a{sv}'),
            null,
            GObject.ParamFlags.READWRITE),
    },
},
class ShellHammerSettingListBoxRow extends Gtk.ListBoxRow {
    _init(label, description, settingsKey, type, options) {
        this.rowType = type;
        this._settings = ExtensionUtils.getSettings(schema_id);

        const _hbox = new Gtk.Box({
            spacing: 12,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
        });
        super._init({
            child: _hbox,
        });

        let _vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
        });
        _hbox.append(_vbox);

        let _label = new Gtk.Label({
            label,
            halign: Gtk.Align.START,
            hexpand: true,
        });
        _vbox.append(_label);

        const _descriptionAttributes = new Pango.AttrList();
        _descriptionAttributes.insert(Pango.attr_scale_new(0.83));
        let _description = new Gtk.Label({
            label: description,
            halign: Gtk.Align.START,
            attributes: _descriptionAttributes,
        });
        _description.get_style_context().add_class('dim-label');
        _vbox.append(_description);

        switch (type) {
        case 'combobox':
            this.control = new Gtk.ComboBoxText();
            for (let item of options.values)
                this.control.append_text(item);
            this._settings.connect(`changed::${settingsKey}`, () => {
                this.control.set_active(this._settings.get_enum(settingsKey));
            });
            this.control.connect('changed', combobox => {
                this._settings.set_enum(settingsKey, combobox.get_active());
            });
            this.control.set_active(this._settings.get_enum(settingsKey) || 0);
            break;
        default:
            this.rowType = 'switch';
            this.control = new Gtk.Switch({
                active: this._settings.get_boolean(settingsKey),
                halign: Gtk.Align.END,
                valign: Gtk.Align.CENTER,
            });
            this._settings.bind(settingsKey, this.control, 'active', Gio.SettingsBindFlags.DEFAULT);
        }
        _hbox.append(this.control);
    }
}
);

const ShellHammerSettingsPane = GObject.registerClass(
    class ShellHammerSettingsPane extends Gtk.Frame {
        _init() {
            super._init({
                margin_top: 36,
                margin_bottom: 36,
                margin_start: 36,
                margin_end: 36,
            });

            const _listBox = new Gtk.ListBox({
                selection_mode: Gtk.SelectionMode.NONE,
                valign: Gtk.Align.START,
                show_separators: true,
            });
            this.set_child(_listBox);

            _listBox.connect('row-activated', (widget, row) => {
                this._rowActivated(widget, row);
            });

            const startupOverview = new ShellHammerSettingListBoxRow(_('Suppress Overview at startup'), _('Suppress Overview animation at startup'), SettingsKey.STARTUP_OVERVIEW);
            _listBox.append(startupOverview);

            const fourFingerSwipe = new ShellHammerSettingListBoxRow(_('Four-finger swipe'), _('Enable four-finger swipe gestures'), SettingsKey.FOUR_FINGER_SWIPE);
            _listBox.append(fourFingerSwipe);
        }

        _rowActivated(widget, row) {
            if (row.rowType === 'switch' || row.rowType === undefined)
                row.control.set_active(!row.control.get_active());
            else if (row.rowType === 'combobox')
                row.control.popup();
        }
    }
);

const ShellHammerSettingsWidget = GObject.registerClass(
    class ShellHammerSettingsWidget extends Gtk.Notebook {
        _init() {
            super._init();

            const _settingsPane = new ShellHammerSettingsPane();
            this.append_page(_settingsPane, new Gtk.Label({ label: _('General') }));
        }
    }
);

function init() {
    ExtensionUtils.initTranslations();
}

function buildPrefsWidget() {
    return new ShellHammerSettingsWidget();
}
