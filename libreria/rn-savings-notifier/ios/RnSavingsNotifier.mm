#import "RnSavingsNotifier.h"

// Header generado por Swift a partir de RnSavingsNotifierImpl.swift. El
// nombre coincide con el módulo del pod ("RnSavingsNotifier"). Toda la
// lógica vive en Swift; esta clase es solo el glue que exige el codegen de
// TurboModule (que genera un protocolo Objective-C++, no uno en Swift).
#import "RnSavingsNotifier-Swift.h"

@implementation RnSavingsNotifier

- (void)showConfirmDialog:(NSString *)title
                   message:(NSString *)message
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
    [[RnSavingsNotifierImpl shared] showConfirmDialogWithTitle:title
                                                         message:message
                                                         resolve:resolve
                                                          reject:reject];
}

- (void)notifyGoalCompleted:(NSString *)goalName
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
    [[RnSavingsNotifierImpl shared] notifyGoalCompletedWithGoalName:goalName
                                                              resolve:resolve
                                                               reject:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeRnSavingsNotifierSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"RnSavingsNotifier";
}

@end
