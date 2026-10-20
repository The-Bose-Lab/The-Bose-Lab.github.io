// Trimmed Mol* viewer bundle: the same Viewer.create() as molstar/apps/viewer
// (same spec, config and behaviours) with only the MolViewSpec extension
// compiled in, since the site requests extensions:['mvs'].
import {createPluginUI} from 'molstar/lib/mol-plugin-ui/index.js';
import {renderReact18} from 'molstar/lib/mol-plugin-ui/react18.js';
import {DefaultPluginUISpec} from 'molstar/lib/mol-plugin-ui/spec.js';
import {PluginBehaviors} from 'molstar/lib/mol-plugin/behavior.js';
import {PluginConfig} from 'molstar/lib/mol-plugin/config.js';
import {PluginSpec} from 'molstar/lib/mol-plugin/spec.js';
import {NoPrimaryFocusLociBindings} from 'molstar/lib/mol-plugin/behavior/dynamic/camera.js';
import {PluginComponent} from 'molstar/lib/mol-plugin-state/component.js';
import {PluginStateObject} from 'molstar/lib/mol-plugin-state/objects.js';
import {decodeColor} from 'molstar/lib/mol-util/color/utils.js';
import {MolViewSpec} from 'molstar/lib/extensions/mvs/behavior.js';
import {MVSData} from 'molstar/lib/extensions/mvs/mvs-data.js';
import {loadMVSData} from 'molstar/lib/extensions/mvs/components/formats.js';
import {ViewerAutoPreset} from 'molstar/lib/apps/viewer/presets.js';
import 'molstar/lib/mol-util/polyfill.js';
export {PLUGIN_VERSION as version} from 'molstar/lib/mol-plugin/version.js';

const ExtensionMap={mvs:PluginSpec.Behavior(MolViewSpec)};
const DefaultViewerOptions={
 extensions:Object.keys(ExtensionMap),disabledExtensions:[],
 layoutIsExpanded:true,layoutShowControls:true,layoutShowRemoteState:true,layoutControlsDisplay:'reactive',layoutShowSequence:true,layoutShowLog:true,layoutShowLeftPanel:true,collapseLeftPanel:false,collapseRightPanel:false,
 disableAntialiasing:PluginConfig.General.DisableAntialiasing.defaultValue,pixelScale:PluginConfig.General.PixelScale.defaultValue,pickScale:PluginConfig.General.PickScale.defaultValue,transparency:PluginConfig.General.Transparency.defaultValue,preferWebgl1:PluginConfig.General.PreferWebGl1.defaultValue,allowMajorPerformanceCaveat:PluginConfig.General.AllowMajorPerformanceCaveat.defaultValue,powerPreference:PluginConfig.General.PowerPreference.defaultValue,resolutionMode:PluginConfig.General.ResolutionMode.defaultValue,
 illumination:false,
 viewportShowReset:PluginConfig.Viewport.ShowReset.defaultValue,viewportShowScreenshotControls:PluginConfig.Viewport.ShowScreenshotControls.defaultValue,viewportShowControls:PluginConfig.Viewport.ShowControls.defaultValue,viewportShowExpand:PluginConfig.Viewport.ShowExpand.defaultValue,viewportShowToggleFullscreen:PluginConfig.Viewport.ShowToggleFullscreen.defaultValue,viewportShowSettings:PluginConfig.Viewport.ShowSettings.defaultValue,viewportShowSelectionMode:PluginConfig.Viewport.ShowSelectionMode.defaultValue,viewportShowAnimation:PluginConfig.Viewport.ShowAnimation.defaultValue,viewportShowTrajectoryControls:PluginConfig.Viewport.ShowTrajectoryControls.defaultValue,
 viewportFocusBehavior:'default',viewportBackgroundColor:undefined,
 pluginStateServer:PluginConfig.State.DefaultServer.defaultValue,volumeStreamingServer:PluginConfig.VolumeStreaming.DefaultServer.defaultValue,volumeStreamingDisabled:!PluginConfig.VolumeStreaming.Enabled.defaultValue,pdbProvider:PluginConfig.Download.DefaultPdbProvider.defaultValue,emdbProvider:PluginConfig.Download.DefaultEmdbProvider.defaultValue,saccharideCompIdMapType:'default',
 config:[],
};
function createViewerSpec(options={}){
 const definedOptions={};for(const p of Object.keys(options))if(options[p]!==void 0)definedOptions[p]=options[p];
 const o={...DefaultViewerOptions,...definedOptions};
 const defaultSpec=DefaultPluginUISpec();
 const disabledExtension=new Set(o.disabledExtensions??[]);
 let baseBehaviors=defaultSpec.behaviors;
 if(o.viewportFocusBehavior==='disabled'){baseBehaviors=baseBehaviors.filter(b=>b.transformer!==PluginBehaviors.Camera.FocusLoci&&b.transformer!==PluginBehaviors.Representation.FocusLoci);}
 else if(o.viewportFocusBehavior==='secondary-zoom'){baseBehaviors=baseBehaviors.filter(b=>b.transformer!==PluginBehaviors.Camera.FocusLoci&&b.transformer!==PluginBehaviors.Representation.FocusLoci);baseBehaviors.push(PluginSpec.Behavior(PluginBehaviors.Camera.FocusLoci,{bindings:NoPrimaryFocusLociBindings}));}
 return {
  canvas3d:{...defaultSpec.canvas3d},
  actions:defaultSpec.actions,
  behaviors:[...baseBehaviors,...o.extensions.filter(e=>!disabledExtension.has(e)).map(e=>{if(!ExtensionMap[e])throw new Error(`Extension '${e}' is not compiled into this build`);return ExtensionMap[e];})],
  animations:[...defaultSpec.animations||[]],
  customParamEditors:defaultSpec.customParamEditors,
  customFormats:o?.customFormats,
  layout:{initial:{isExpanded:o.layoutIsExpanded,showControls:o.layoutShowControls,controlsDisplay:o.layoutControlsDisplay,regionState:{bottom:'full',left:o.collapseLeftPanel?'collapsed':'full',right:o.collapseRightPanel?'hidden':'full',top:'full'}}},
  components:{...defaultSpec.components,controls:{...defaultSpec.components?.controls,top:o.layoutShowSequence?undefined:'none',bottom:o.layoutShowLog?undefined:'none',left:o.layoutShowLeftPanel?undefined:'none'},remoteState:o.layoutShowRemoteState?'default':'none'},
  config:[
   [PluginConfig.General.DisableAntialiasing,o.disableAntialiasing],
   [PluginConfig.General.PixelScale,o.pixelScale],
   [PluginConfig.General.PickScale,o.pickScale],
   [PluginConfig.General.Transparency,o.transparency],
   [PluginConfig.General.PreferWebGl1,o.preferWebgl1],
   [PluginConfig.General.AllowMajorPerformanceCaveat,o.allowMajorPerformanceCaveat],
   [PluginConfig.General.PowerPreference,o.powerPreference],
   [PluginConfig.General.ResolutionMode,o.resolutionMode],
   [PluginConfig.Viewport.ShowReset,o.viewportShowReset],
   [PluginConfig.Viewport.ShowScreenshotControls,o.viewportShowScreenshotControls],
   [PluginConfig.Viewport.ShowControls,o.viewportShowControls],
   [PluginConfig.Viewport.ShowExpand,o.viewportShowExpand],
   [PluginConfig.Viewport.ShowToggleFullscreen,o.viewportShowToggleFullscreen],
   [PluginConfig.Viewport.ShowSettings,o.viewportShowSettings],
   [PluginConfig.Viewport.ShowSelectionMode,o.viewportShowSelectionMode],
   [PluginConfig.Viewport.ShowAnimation,o.viewportShowAnimation],
   [PluginConfig.Viewport.ShowTrajectoryControls,o.viewportShowTrajectoryControls],
   [PluginConfig.State.DefaultServer,o.pluginStateServer],
   [PluginConfig.State.CurrentServer,o.pluginStateServer],
   [PluginConfig.VolumeStreaming.DefaultServer,o.volumeStreamingServer],
   [PluginConfig.VolumeStreaming.Enabled,!o.volumeStreamingDisabled],
   [PluginConfig.Download.DefaultPdbProvider,o.pdbProvider],
   [PluginConfig.Download.DefaultEmdbProvider,o.emdbProvider],
   [PluginConfig.Structure.DefaultRepresentationPreset,ViewerAutoPreset.id],
   [PluginConfig.Structure.SaccharideCompIdMapType,o.saccharideCompIdMapType],
   ...(o.config??[]),
  ]
 };
}
export class Viewer{
 constructor(plugin){this._events=new PluginComponent();this.subscribe=this._events.subscribe.bind(this._events);this.plugin=plugin;Viewer.instances.push(this);}
 static async create(elementOrId,options={}){
  const spec=createViewerSpec(options);
  const element=typeof elementOrId==='string'?document.getElementById(elementOrId):elementOrId;
  if(!element)throw new Error(`Could not get element with id '${elementOrId}'`);
  const plugin=await createPluginUI({target:element,spec,render:renderReact18,onBeforeUIRender:plugin=>{plugin.builders.structure.representation.registerPreset(ViewerAutoPreset);}});
  plugin.canvas3d?.setProps({illumination:{enabled:options.illumination??DefaultViewerOptions.illumination}});
  if(options.viewportBackgroundColor??DefaultViewerOptions.viewportBackgroundColor){const backgroundColor=decodeColor(options.viewportBackgroundColor??DefaultViewerOptions.viewportBackgroundColor);if(typeof backgroundColor==='number')plugin.canvas3d?.setProps({renderer:{backgroundColor}});}
  return new Viewer(plugin);
 }
 async loadMvsData(data,format,options){await this.plugin.initialized;return loadMVSData(this.plugin,data,format,options);}
 handleResize(){this.plugin.layout.events.updated.next(void 0);}
 dispose(){this._events.dispose();this.plugin.dispose();Viewer.instances.splice(Viewer.instances.indexOf(this),1);}
}
Viewer.instances=[];
export const PluginExtensions={mvs:{MVSData,createBuilder:()=>MVSData.createBuilder()}};
export const lib={plugin:{PluginStateObject}};
