import { z } from 'zod';
import { loose } from './envelope.js';

export const AdvancedConfigSchema = loose({
  log_upload: z.boolean(),
});

export const BaseConfigSchema = loose({
  launcher_background_img: z.string(),
  launcher_background_img_crc64: z.string(),
  config_open: z.boolean(),
  user_agreement: z.string(),
  privacy_policy: z.string(),
  copyright_information: z.string(),
  notice_pop_open: z.boolean(),
  notice_content: z.string(),
  exit_launcher_open: z.boolean(),
});

export const GameConfigSchema = loose({
  game_lowest_version: z.string(),
  game_latest_version: z.string(),
  game_latest_file_path: z.string(),
  game_start_exe_name: z.string(),
  game_file_size: z.string(),
  game_file_size_type: z.string(),
  crc64: z.string(),
  size: z.number(),
  file_url: z.string(),
  decompression_size: z.string(),
  config_id: z.number(),
  game_start_params: z.array(z.string()),
  game_uninstall_script: z.string(),
});

export const OperationsResourceSchema = loose({
  banner_loop: z.boolean(),
  news_list: z.unknown().nullable(),
  notice_list: z.unknown().nullable(),
  operations_banner_list: z.array(loose({ banner_img: z.string(), jump_url: z.string() })),
  operations_resource_open: z.boolean(),
  time_interval: z.number(),
});

export const SocialMediaResourceSchema = loose({
  social_media_resource_open: z.boolean(),
  social_media_resource_list: z.array(
    loose({
      social_media_channel: z.string(),
      qr_img: z.string(),
      jump_url: z.string(),
    }),
  ),
  contact_customer_complaint: z.boolean(),
  contact_customer_complaint_type: z.number(),
  web_customer_complaint_url: z.string(),
  aihelp_customer_complaint: loose({
    aihelp_app_id: z.string(),
    aihelp_domain: z.string(),
    aihelp_app_key: z.string(),
    initial_interface: z.number(),
  }),
  mail_customer_complaint_url: z.string(),
});

export const DownloadCdnSchema = loose({
  back_up_cdn: z.string(),
  primary_cdn: z.string(),
});

export const GameConfigJsonSchema = loose({
  url: z.string(),
});

export const InstallationConfigSchema = loose({
  installer_background_img: z.string().optional(),
  installation_protocol_open: z.boolean().optional(),
  installation_protocol: z.string().optional(),
});

export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;
export type BaseConfig = z.infer<typeof BaseConfigSchema>;
export type GameConfig = z.infer<typeof GameConfigSchema>;
export type OperationsResource = z.infer<typeof OperationsResourceSchema>;
export type SocialMediaResource = z.infer<typeof SocialMediaResourceSchema>;
export type DownloadCdn = z.infer<typeof DownloadCdnSchema>;
export type GameConfigJson = z.infer<typeof GameConfigJsonSchema>;
export type InstallationConfig = z.infer<typeof InstallationConfigSchema>;
