import os

def shutdown_system():
    try:
        os.system('sudo shutdown -h now')
    except Exception as e:
        return str(e)


def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            contents = file.read()
            return contents
    except Exception as e:
        return str(e)


def delete_all_files(path):
    try:
        items = os.listdir(path)
        for item in items:
            item_path = os.path.join(path, item)
            if os.path.isfile(item_path):
                os.remove(item_path)
        
        return "All files deleted successfully."
    except Exception as e:
        return str(e)
        

path="./Routes/UserPrograms"
# result = delete_all_files(path)
shutdown_system()
# print(result)