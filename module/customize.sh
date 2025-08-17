ui_print "安装中"

set_perm_recursive $MODPATH 0 0 0755 0644
set_perm  $MODPATH/oukaro 0 0 0755

if [ -f "$MODPATH/config.toml" ]; then
    ui_print "配置文件已存在，跳过"
else
    cat > "$MODPATH/config.toml" <<'EOF'
[app]
priv_app = ["test", "test1"]
system_app = ["test", "test1"]
EOF
fi
